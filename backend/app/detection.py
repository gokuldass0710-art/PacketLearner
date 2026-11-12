"""Deterministic, capture-only detection rules for decoded packet evidence."""

from dataclasses import dataclass
from typing import Dict, List, Tuple

from .models import DetectionFinding, FindingTimeWindow, TCPFlags


# A potential scan must hit several ports quickly. These values are deliberately
# conservative so normal application traffic is not reported as a scan.
SCAN_RULE_ID = "PL-RULE-001"
SCAN_RULE_NAME = "POTENTIAL_TCP_PORT_SCAN"
SCAN_WINDOW_SECONDS = 10.0
MIN_DISTINCT_DESTINATION_PORTS = 5
MIN_SYN_PACKETS = 5


@dataclass(frozen=True)
class DecodedPacketEvidence:
    packet_id: int
    timestamp: float
    source_ip: str
    destination_ip: str
    destination_port: int | None
    protocol: str
    tcp_flags: TCPFlags | None


def _is_syn_probe(packet: DecodedPacketEvidence) -> bool:
    """Prefer initial SYNs, excluding SYN-ACK responses and ordinary ACK traffic."""
    return (
        packet.protocol.upper() == "TCP"
        and packet.destination_port is not None
        and packet.tcp_flags is not None
        and packet.tcp_flags.syn
        and not packet.tcp_flags.ack
    )


def detect_potential_tcp_port_scans(
    packets: List[DecodedPacketEvidence],
) -> List[DetectionFinding]:
    """Find source/destination pairs with a dense window of TCP SYN probes."""
    grouped: Dict[Tuple[str, str], List[DecodedPacketEvidence]] = {}
    for packet in packets:
        if _is_syn_probe(packet):
            grouped.setdefault((packet.source_ip, packet.destination_ip), []).append(packet)

    findings: List[DetectionFinding] = []
    for (source_ip, destination_ip), probes in grouped.items():
        probes.sort(key=lambda packet: packet.timestamp)
        qualifying_window: List[DecodedPacketEvidence] | None = None

        for start_index, start_packet in enumerate(probes):
            window = [
                packet
                for packet in probes[start_index:]
                if packet.timestamp - start_packet.timestamp <= SCAN_WINDOW_SECONDS
            ]
            distinct_ports = {packet.destination_port for packet in window}
            if len(distinct_ports) >= MIN_DISTINCT_DESTINATION_PORTS and len(window) >= MIN_SYN_PACKETS:
                qualifying_window = window
                break

        if not qualifying_window:
            continue

        ports = sorted({packet.destination_port for packet in qualifying_window if packet.destination_port is not None})
        start_seconds = qualifying_window[0].timestamp
        end_seconds = qualifying_window[-1].timestamp
        duration_seconds = round(max(0.0, end_seconds - start_seconds), 6)
        findings.append(
            DetectionFinding(
                id=f"{SCAN_RULE_ID}:{source_ip}:{destination_ip}",
                ruleId=SCAN_RULE_ID,
                ruleName=SCAN_RULE_NAME,
                title="Potential TCP port scan",
                severity="medium",
                sourceIp=source_ip,
                destinationIp=destination_ip,
                observedDestinationPorts=ports,
                timeWindow=FindingTimeWindow(
                    startSeconds=round(start_seconds, 6),
                    endSeconds=round(end_seconds, 6),
                    durationSeconds=duration_seconds,
                ),
                packetCount=len(qualifying_window),
                relevantPacketIds=[packet.packet_id for packet in qualifying_window],
                explanation=(
                    f"{source_ip} sent {len(qualifying_window)} TCP SYN probes to "
                    f"{len(ports)} distinct ports on {destination_ip} within "
                    f"{duration_seconds:.3f} seconds. This pattern is consistent with a "
                    "potential port scan, but it is not confirmation of malicious activity."
                ),
                recommendedSteps=[
                    "Verify whether the source is an authorized vulnerability scanner or administrator tool.",
                    "Review the listed packets for SYN-only attempts and any completed handshakes or resets.",
                    "Correlate the relative time window with host, firewall, and IDS logs.",
                ],
            )
        )

    return findings
