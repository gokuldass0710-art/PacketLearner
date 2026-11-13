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

# Repeated SYN attempts to one destination can indicate a potential SYN flood,
# but the threshold is intentionally high enough to avoid flagging a normal
# handshake burst or a small port scan.
SYN_ATTEMPT_RULE_ID = "PL-RULE-002"
SYN_ATTEMPT_RULE_NAME = "POTENTIAL_TCP_SYN_FLOOD"
SYN_ATTEMPT_WINDOW_SECONDS = 5.0
MIN_SYN_ATTEMPTS = 20

# UDP has no handshake, so this rule uses a conservative distinct-port and
# packet-count threshold within a short window.
UDP_SCAN_RULE_ID = "PL-RULE-003"
UDP_SCAN_RULE_NAME = "POTENTIAL_UDP_PORT_SCAN"
UDP_SCAN_WINDOW_SECONDS = 10.0
MIN_UDP_PACKETS = 8
MIN_DISTINCT_UDP_DESTINATION_PORTS = 8


@dataclass(frozen=True)
class DecodedPacketEvidence:
    packet_id: int
    timestamp: float
    source_ip: str
    destination_ip: str
    destination_port: int | None
    protocol: str
    transport_protocol: str
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


def _finding(
    *,
    finding_id: str,
    rule_id: str,
    rule_name: str,
    title: str,
    severity: str,
    source_ip: str,
    destination_ip: str,
    packets: List[DecodedPacketEvidence],
    explanation: str,
    recommended_steps: List[str],
) -> DetectionFinding:
    ports = sorted({packet.destination_port for packet in packets if packet.destination_port is not None})
    start_seconds = packets[0].timestamp
    end_seconds = packets[-1].timestamp
    return DetectionFinding(
        id=finding_id,
        ruleId=rule_id,
        ruleName=rule_name,
        title=title,
        severity=severity,
        sourceIp=source_ip,
        destinationIp=destination_ip,
        observedDestinationPorts=ports,
        timeWindow=FindingTimeWindow(
            startSeconds=round(start_seconds, 6),
            endSeconds=round(end_seconds, 6),
            durationSeconds=round(max(0.0, end_seconds - start_seconds), 6),
        ),
        packetCount=len(packets),
        relevantPacketIds=[packet.packet_id for packet in packets],
        explanation=explanation,
        recommendedSteps=recommended_steps,
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
        findings.append(_finding(
            finding_id=f"{SCAN_RULE_ID}:{source_ip}:{destination_ip}",
            rule_id=SCAN_RULE_ID,
            rule_name=SCAN_RULE_NAME,
            title="Potential TCP port scan",
            severity="medium",
            source_ip=source_ip,
            destination_ip=destination_ip,
            packets=qualifying_window,
            explanation=(
                f"{source_ip} sent {len(qualifying_window)} TCP SYN probes to "
                f"{len(ports)} distinct ports on {destination_ip} within "
                f"{duration_seconds:.3f} seconds. This pattern is consistent with a "
                "potential port scan, but it is not confirmation of malicious activity."
            ),
            recommended_steps=[
                "Verify whether the source is an authorized vulnerability scanner or administrator tool.",
                "Review the listed packets for SYN-only attempts and any completed handshakes or resets.",
                "Correlate the relative time window with host, firewall, and IDS logs.",
            ],
        ))

    return findings


def detect_potential_tcp_syn_floods(
    packets: List[DecodedPacketEvidence],
) -> List[DetectionFinding]:
    """Find dense bursts of TCP SYN-only attempts to one destination."""
    grouped: Dict[Tuple[str, str], List[DecodedPacketEvidence]] = {}
    for packet in packets:
        if _is_syn_probe(packet):
            grouped.setdefault((packet.source_ip, packet.destination_ip), []).append(packet)

    findings: List[DetectionFinding] = []
    for (source_ip, destination_ip), probes in grouped.items():
        probes.sort(key=lambda packet: packet.timestamp)
        for start_index, start_packet in enumerate(probes):
            window = [
                packet for packet in probes[start_index:]
                if packet.timestamp - start_packet.timestamp <= SYN_ATTEMPT_WINDOW_SECONDS
            ]
            if len(window) < MIN_SYN_ATTEMPTS:
                continue
            findings.append(_finding(
                finding_id=f"{SYN_ATTEMPT_RULE_ID}:{source_ip}:{destination_ip}",
                rule_id=SYN_ATTEMPT_RULE_ID,
                rule_name=SYN_ATTEMPT_RULE_NAME,
                title="Potential TCP SYN flood or repeated connection attempts",
                severity="high",
                source_ip=source_ip,
                destination_ip=destination_ip,
                packets=window,
                explanation=(
                    f"{source_ip} sent {len(window)} TCP SYN-only connection attempts to "
                    f"{destination_ip} within {window[-1].timestamp - window[0].timestamp:.3f} seconds. "
                    "This is a potential SYN flood or repeated-attempt pattern, not proof of an attack."
                ),
                recommended_steps=[
                    "Check whether the source is an authorized load, health-check, or testing system.",
                    "Review SYN-ACK, RST, and completed-session responses around the listed packet IDs.",
                    "Correlate the window with host, firewall, and IDS telemetry before escalating.",
                ],
            ))
            break
    return findings


def detect_potential_udp_port_scans(
    packets: List[DecodedPacketEvidence],
) -> List[DetectionFinding]:
    """Find dense UDP probes spanning many destination ports."""
    grouped: Dict[Tuple[str, str], List[DecodedPacketEvidence]] = {}
    for packet in packets:
        if packet.transport_protocol == "UDP" and packet.destination_port is not None:
            grouped.setdefault((packet.source_ip, packet.destination_ip), []).append(packet)

    findings: List[DetectionFinding] = []
    for (source_ip, destination_ip), probes in grouped.items():
        probes.sort(key=lambda packet: packet.timestamp)
        for start_index, start_packet in enumerate(probes):
            window = [
                packet for packet in probes[start_index:]
                if packet.timestamp - start_packet.timestamp <= UDP_SCAN_WINDOW_SECONDS
            ]
            ports = {packet.destination_port for packet in window}
            if len(window) < MIN_UDP_PACKETS or len(ports) < MIN_DISTINCT_UDP_DESTINATION_PORTS:
                continue
            findings.append(_finding(
                finding_id=f"{UDP_SCAN_RULE_ID}:{source_ip}:{destination_ip}",
                rule_id=UDP_SCAN_RULE_ID,
                rule_name=UDP_SCAN_RULE_NAME,
                title="Potential UDP port scan",
                severity="medium",
                source_ip=source_ip,
                destination_ip=destination_ip,
                packets=window,
                explanation=(
                    f"{source_ip} sent {len(window)} UDP packets to {len(ports)} distinct ports on "
                    f"{destination_ip} within {window[-1].timestamp - window[0].timestamp:.3f} seconds. "
                    "This is consistent with a potential UDP port scan, not proof of an attack."
                ),
                recommended_steps=[
                    "Verify whether the source is performing authorized discovery or service monitoring.",
                    "Inspect the listed UDP packets and any ICMP unreachable responses.",
                    "Correlate the relative window with endpoint, firewall, and IDS logs.",
                ],
            ))
            break
    return findings


def detect_findings(packets: List[DecodedPacketEvidence]) -> List[DetectionFinding]:
    """Run all deterministic rules over decoded evidence only."""
    return [
        *detect_potential_tcp_port_scans(packets),
        *detect_potential_tcp_syn_floods(packets),
        *detect_potential_udp_port_scans(packets),
    ]
