from app.detection import DecodedPacketEvidence, detect_findings
from app.models import TCPFlags


def tcp_probe(packet_id: int, timestamp: float, port: int, *, ack: bool = False):
    return DecodedPacketEvidence(
        packet_id=packet_id,
        timestamp=timestamp,
        source_ip="10.0.0.1",
        destination_ip="10.0.0.2",
        destination_port=port,
        protocol="TCP",
        transport_protocol="TCP",
        tcp_flags=TCPFlags(syn=True, ack=ack),
    )


def udp_probe(packet_id: int, timestamp: float, port: int):
    return DecodedPacketEvidence(
        packet_id=packet_id,
        timestamp=timestamp,
        source_ip="10.0.0.3",
        destination_ip="10.0.0.4",
        destination_port=port,
        protocol="UDP",
        transport_protocol="UDP",
        tcp_flags=None,
    )


def test_detection_rules_report_tcp_scan_syn_flood_and_udp_scan():
    packets = [tcp_probe(i, i * 0.1, 1000 + i) for i in range(5)]
    packets.extend(tcp_probe(100 + i, i * 0.1, 443) for i in range(20))
    packets.extend(udp_probe(200 + i, i * 0.1, 2000 + i) for i in range(8))

    findings = detect_findings(packets)
    assert {finding.ruleId for finding in findings} == {"PL-RULE-001", "PL-RULE-002", "PL-RULE-003"}


def test_detection_ignores_acknowledged_syn_and_slow_probes():
    packets = [tcp_probe(i, i * 11, 1000 + i, ack=True) for i in range(5)]
    assert detect_findings(packets) == []
