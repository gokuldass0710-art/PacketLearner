import asyncio
import io
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, UploadFile

from app import analyzer


@pytest.mark.parametrize(
    ("header", "expected"),
    [
        (analyzer.PCAP_MAGIC_LE, "pcap"),
        (analyzer.PCAP_MAGIC_BE, "pcap"),
        (analyzer.PCAP_MAGIC_NANO_LE, "pcap"),
        (analyzer.PCAP_MAGIC_NANO_BE, "pcap"),
        (analyzer.PCAPNG_MAGIC, "pcapng"),
    ],
)
def test_validate_capture_header_accepts_supported_signatures(header, expected):
    assert analyzer.validate_capture_header(header + b"test") == expected


@pytest.mark.parametrize("payload", [b"", b"not-a-capture"])
def test_validate_capture_header_rejects_invalid_data(payload):
    with pytest.raises(HTTPException) as error:
        analyzer.validate_capture_header(payload)
    assert error.value.status_code == 400


def test_save_upload_rejects_unsupported_extension():
    upload = UploadFile(filename="capture.txt", file=io.BytesIO(analyzer.PCAP_MAGIC_LE))

    with pytest.raises(HTTPException, match="Invalid file extension"):
        asyncio.run(analyzer.save_upload_to_temp(upload))


def test_save_upload_enforces_size_limit(monkeypatch):
    monkeypatch.setattr(analyzer.settings, "MAX_UPLOAD_SIZE_MB", 1)
    upload = UploadFile(
        filename="capture.pcap",
        file=io.BytesIO(analyzer.PCAP_MAGIC_LE + b"x" * (1024 * 1024)),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(analyzer.save_upload_to_temp(upload))
    assert error.value.status_code == 413


def test_analysis_response_is_built_from_mocked_tshark(monkeypatch, tmp_path):
    tshark = tmp_path / "tshark"
    tshark.touch()
    monkeypatch.setattr(analyzer.settings, "TSHARK_PATH", str(tshark))
    header = [
        "frame.number", "frame.time_epoch", "frame.time_relative", "frame.len",
        "frame.protocols", "ip.src", "ip.dst", "tcp.srcport", "tcp.dstport",
        "_ws.col.Protocol", "tcp.flags", "_ws.col.Info",
    ]
    row = [
        "7", "1700000000.0", "1.25", "60", "eth:ip:tcp", "10.0.0.1",
        "10.0.0.2", "40000", "443", "TCP", "0x0002", "SYN",
    ]
    mocked_process = SimpleNamespace(
        returncode=0,
        stdout="\t".join(header) + "\n" + "\t".join(row) + "\n",
        stderr="",
    )
    run = lambda *args, **kwargs: mocked_process
    monkeypatch.setattr(analyzer.subprocess, "run", run)

    response = analyzer.analyze_pcap_with_tshark(
        str(tmp_path / "input.pcap"), "input.pcap", 128, "pcap", max_packets=1
    )

    assert response.metadata.totalPackets == 1
    assert response.packets[0].id == 7
    assert response.packets[0].protocol == "TCP"
    assert response.packets[0].tcpFlags.syn is True
