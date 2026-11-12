import os
import subprocess
import tempfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict, Any, List

from fastapi import HTTPException, UploadFile, status

from .config import settings
from .detection import DecodedPacketEvidence, detect_potential_tcp_port_scans
from .models import (
    AnalysisResponse,
    CaptureMetadata,
    PacketRecord,
    ProtocolCount,
    TCPFlags,
    TopTalker,
)

# PCAP / PCAPNG Magic Byte Signatures
PCAP_MAGIC_LE = b"\xd4\xc3\xb2\xa1"
PCAP_MAGIC_BE = b"\xa1\xb2\xc3\xd4"
PCAP_MAGIC_NANO_LE = b"\x4d\x3c\xb2\xa1"
PCAP_MAGIC_NANO_BE = b"\xa1\xb2\x3c\x4d"
PCAPNG_MAGIC = b"\x0a\x0d\x0d\x0a"

VALID_MAGIC_BYTES = (
    PCAP_MAGIC_LE,
    PCAP_MAGIC_BE,
    PCAP_MAGIC_NANO_LE,
    PCAP_MAGIC_NANO_BE,
    PCAPNG_MAGIC,
)


def get_tshark_version() -> Tuple[bool, str, Optional[str]]:
    """Check if TShark is installed and get its version string."""
    tshark_path = settings.TSHARK_PATH
    if not os.path.isfile(tshark_path):
        return False, tshark_path, None

    try:
        proc = subprocess.run(
            [tshark_path, "-v"],
            capture_output=True,
            text=True,
            timeout=5,
            shell=False,
        )
        if proc.returncode == 0 and proc.stdout:
            first_line = proc.stdout.splitlines()[0].strip()
            return True, tshark_path, first_line
        return True, tshark_path, "TShark found (version output unavailable)"
    except Exception as exc:
        return True, tshark_path, f"Error getting version: {str(exc)}"


def parse_tcp_flags(flags_str: str) -> Optional[TCPFlags]:
    """Parse TShark TCP flags hex string (e.g. '0x0002', '0x0012') into TCPFlags model."""
    if not flags_str or not flags_str.startswith("0x"):
        return None

    try:
        val = int(flags_str, 16)
        return TCPFlags(
            fin=bool(val & 0x01),
            syn=bool(val & 0x02),
            rst=bool(val & 0x04),
            psh=bool(val & 0x08),
            ack=bool(val & 0x10),
            urg=bool(val & 0x20),
            raw=flags_str,
        )
    except ValueError:
        return None


def infer_protocol(
    protocol_stack: str,
    tcp_flags: str,
    tcp_source_port: str,
    tcp_destination_port: str,
    udp_source_port: str,
    udp_destination_port: str,
) -> str:
    """Infer a useful protocol label when TShark's display column is empty or OTHER."""
    layer_names = [part.strip().lower() for part in protocol_stack.split(":") if part.strip()]
    protocol_names = {
        "dns": "DNS",
        "http": "HTTP",
        "http2": "HTTP",
        "tls": "TLS",
        "ssl": "TLS",
        "dhcp": "DHCP",
        "bootp": "DHCP",
        "arp": "ARP",
        "icmp": "ICMP",
        "icmpv6": "ICMP",
        "tcp": "TCP",
        "udp": "UDP",
    }
    for layer in reversed(layer_names):
        if layer in protocol_names:
            return protocol_names[layer]

    if tcp_flags or tcp_source_port or tcp_destination_port:
        return "TCP"
    if udp_source_port or udp_destination_port:
        return "UDP"
    return "OTHER"


def validate_capture_header(initial_bytes: bytes) -> str:
    """Validate that the capture header contains valid PCAP or PCAPNG magic numbers."""
    if len(initial_bytes) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too small to be a valid PCAP or PCAPNG capture.",
        )

    prefix = initial_bytes[:4]
    if prefix == PCAPNG_MAGIC:
        return "pcapng"
    elif prefix in (PCAP_MAGIC_LE, PCAP_MAGIC_BE, PCAP_MAGIC_NANO_LE, PCAP_MAGIC_NANO_BE):
        return "pcap"

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            "Invalid file format. The file does not contain a recognized PCAP or PCAPNG "
            "header signature."
        ),
    )


async def save_upload_to_temp(file: UploadFile) -> Tuple[str, str, int]:
    """
    Safely stream upload to a temporary file while verifying size and header signatures.
    Returns: (temp_file_path, format_type, total_bytes_read)
    """
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    chunk_size = 64 * 1024  # 64 KB chunks

    # Check extension
    filename = file.filename or "capture.pcap"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in (".pcap", ".pcapng"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension. Only .pcap and .pcapng files are supported.",
        )

    # Read first chunk to inspect magic header
    first_chunk = await file.read(chunk_size)
    if not first_chunk:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    fmt = validate_capture_header(first_chunk)

    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{fmt}")
    temp_path = temp_file.name
    total_bytes = len(first_chunk)

    try:
        temp_file.write(first_chunk)

        # Stream remaining chunks
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                temp_file.close()
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
                )
            temp_file.write(chunk)

        temp_file.flush()
        temp_file.close()
        return temp_path, fmt, total_bytes
    except Exception:
        temp_file.close()
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise


def analyze_pcap_with_tshark(
    temp_path: str,
    original_filename: str,
    file_size_bytes: int,
    file_format: str,
    max_packets: int = 1000,
) -> AnalysisResponse:
    """
    Invoke TShark as a non-shell subprocess to decode packets and extract metrics.
    Guarantees process termination and resource limits.
    """
    tshark_path = settings.TSHARK_PATH
    if not os.path.isfile(tshark_path):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"TShark executable not found at '{tshark_path}'. "
                "Ensure Wireshark / TShark is installed or set TSHARK_PATH in backend .env."
            ),
        )

    # Define exact fields to extract
    field_args = [
        "-e", "frame.number",
        "-e", "frame.time_epoch",
        "-e", "frame.time_relative",
        "-e", "frame.len",
        "-e", "frame.protocols",
        "-e", "ip.src",
        "-e", "ipv6.src",
        "-e", "ip.dst",
        "-e", "ipv6.dst",
        "-e", "tcp.srcport",
        "-e", "udp.srcport",
        "-e", "tcp.dstport",
        "-e", "udp.dstport",
        "-e", "_ws.col.Protocol",
        "-e", "tcp.flags",
        "-e", "_ws.col.Info",
        "-e", "arp.src.proto_ipv4",
        "-e", "arp.dst.proto_ipv4",
        "-e", "eth.src",
        "-e", "eth.dst",
    ]

    cmd = [
        tshark_path,
        "-r", temp_path,
        "-n",                     # Disable network name resolution (DNS lookups)
        "-T", "fields",
        "-E", "separator=/t",     # Tab separator
        "-E", "header=y",         # Include column header row
        "-E", "occurrence=f",     # First occurrence of multi-value fields
        *field_args,
    ]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=settings.ANALYSIS_TIMEOUT_SECONDS,
            shell=False,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=(
                f"Analysis timed out after {settings.ANALYSIS_TIMEOUT_SECONDS} seconds. "
                "The capture file is too large or complex for current processing limits."
            ),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute TShark subprocess: {str(exc)}",
        )

    if proc.returncode != 0:
        stderr_msg = proc.stderr.strip() if proc.stderr else "Unknown error"
        # Sanitize common TShark error output
        clean_error = stderr_msg.splitlines()[-1] if stderr_msg else "Invalid capture file."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"TShark encountered an error decoding capture: {clean_error}",
        )

    lines = proc.stdout.splitlines()
    if not lines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TShark completed but found no packet records in the file.",
        )

    # First row is the header
    header = lines[0].split("\t")
    field_indices = {name: idx for idx, name in enumerate(header)}

    packet_records: List[PacketRecord] = []
    protocol_counter: Counter[str] = Counter()
    talker_packets: Counter[str] = Counter()
    talker_bytes: Counter[str] = Counter()
    decoded_evidence: List[DecodedPacketEvidence] = []

    total_packets = 0
    first_epoch: Optional[float] = None
    last_epoch: Optional[float] = None

    for line in lines[1:]:
        if not line.strip():
            continue

        parts = line.split("\t")
        total_packets += 1

        def get_val(field_name: str) -> str:
            idx = field_indices.get(field_name)
            if idx is not None and idx < len(parts):
                return parts[idx].strip()
            return ""

        # Frame number
        try:
            frame_num = int(get_val("frame.number") or total_packets)
        except ValueError:
            frame_num = total_packets

        # Epoch & relative time
        epoch_str = get_val("frame.time_epoch")
        try:
            epoch = float(epoch_str) if epoch_str else 0.0
            if first_epoch is None or epoch < first_epoch:
                first_epoch = epoch
            if last_epoch is None or epoch > last_epoch:
                last_epoch = epoch
        except ValueError:
            epoch = 0.0

        rel_time_str = get_val("frame.time_relative")
        try:
            rel_time = float(rel_time_str) if rel_time_str else 0.0
        except ValueError:
            rel_time = 0.0

        # Length
        try:
            length = int(get_val("frame.len") or 0)
        except ValueError:
            length = 0

        # Source & Destination Addresses
        src_ip = (
            get_val("ip.src")
            or get_val("ipv6.src")
            or get_val("arp.src.proto_ipv4")
            or get_val("eth.src")
            or "0.0.0.0"
        )
        dst_ip = (
            get_val("ip.dst")
            or get_val("ipv6.dst")
            or get_val("arp.dst.proto_ipv4")
            or get_val("eth.dst")
            or "0.0.0.0"
        )

        # Ports
        sport_str = get_val("tcp.srcport") or get_val("udp.srcport")
        dport_str = get_val("tcp.dstport") or get_val("udp.dstport")
        sport = int(sport_str) if sport_str.isdigit() else None
        dport = int(dport_str) if dport_str.isdigit() else None

        # Protocol & Info
        proto_column = get_val("_ws.col.Protocol").strip()
        if not proto_column or proto_column.upper() in {"OTHER", "DATA"}:
            proto = infer_protocol(
                get_val("frame.protocols"), get_val("tcp.flags"),
                get_val("tcp.srcport"), get_val("tcp.dstport"),
                get_val("udp.srcport"), get_val("udp.dstport"),
            )
        else:
            proto = proto_column
        info = get_val("_ws.col.Info")
        flags = parse_tcp_flags(get_val("tcp.flags"))

        # Retain lightweight decoded evidence for rules, including packets beyond
        # max_packets (the response list is intentionally bounded for the UI).
        decoded_evidence.append(
            DecodedPacketEvidence(
                packet_id=frame_num,
                timestamp=rel_time,
                source_ip=src_ip,
                destination_ip=dst_ip,
                destination_port=(int(get_val("tcp.dstport")) if get_val("tcp.dstport").isdigit() else None),
                protocol=proto,
                tcp_flags=flags,
            )
        )

        # Accumulate metrics across all packets in file
        protocol_counter[proto] += 1
        if src_ip and src_ip != "0.0.0.0":
            talker_packets[src_ip] += 1
            talker_bytes[src_ip] += length
        if dst_ip and dst_ip != "0.0.0.0":
            talker_packets[dst_ip] += 1
            talker_bytes[dst_ip] += length

        # Keep records up to max_packets limit to avoid unbounded responses
        if len(packet_records) < max_packets:
            formatted_time = f"{rel_time:.6f}"
            packet_records.append(
                PacketRecord(
                    id=frame_num,
                    timestamp=round(rel_time, 6),
                    formattedTime=formatted_time,
                    sourceIp=src_ip,
                    destinationIp=dst_ip,
                    sourcePort=sport,
                    destinationPort=dport,
                    protocol=proto,
                    length=length,
                    info=info,
                    tcpFlags=flags,
                )
            )

    # Compute duration and timestamps
    duration = 0.0
    start_iso = None
    end_iso = None

    if first_epoch is not None and last_epoch is not None:
        duration = max(0.0, round(last_epoch - first_epoch, 3))
        start_iso = datetime.fromtimestamp(first_epoch, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        end_iso = datetime.fromtimestamp(last_epoch, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Format protocol counts with percentages
    protocol_counts: List[ProtocolCount] = []
    for proto_name, count in protocol_counter.most_common():
        pct = round((count / total_packets) * 100, 2) if total_packets > 0 else 0.0
        protocol_counts.append(
            ProtocolCount(protocol=proto_name, count=count, percentage=pct)
        )

    # Format top talkers
    top_talkers_list: List[TopTalker] = []
    # Sort talkers by total bytes
    sorted_talkers = sorted(
        talker_bytes.keys(),
        key=lambda ip: (talker_bytes[ip], talker_packets[ip]),
        reverse=True,
    )
    for ip in sorted_talkers[:10]:
        top_talkers_list.append(
            TopTalker(
                ip=ip,
                packetCount=talker_packets[ip],
                bytes=talker_bytes[ip],
            )
        )

    metadata = CaptureMetadata(
        fileName=original_filename,
        fileSizeBytes=file_size_bytes,
        format=file_format,
        totalPackets=total_packets,
        returnedPackets=len(packet_records),
        startTime=start_iso,
        endTime=end_iso,
        durationSeconds=duration,
    )
    findings = detect_potential_tcp_port_scans(decoded_evidence)

    return AnalysisResponse(
        metadata=metadata,
        protocolCounts=protocol_counts,
        topTalkers=top_talkers_list,
        packets=packet_records,
        findings=findings,
    )
