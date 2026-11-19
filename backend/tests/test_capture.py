import io
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app import capture
from app import main


class FakeProcess:
    def __init__(self):
        self.returncode = None
        self.stderr = io.BytesIO()

    def poll(self):
        return self.returncode

    def terminate(self):
        self.returncode = 0

    def wait(self, timeout=None):
        self.returncode = 0


def test_capture_start_uses_safe_bounded_tshark_command(monkeypatch, tmp_path):
    tshark = tmp_path / "tshark"
    tshark.touch()
    monkeypatch.setattr(capture.settings, "TSHARK_PATH", str(tshark))
    monkeypatch.setattr(capture.settings, "CAPTURE_DURATION_SECONDS", 12)
    monkeypatch.setattr(capture.settings, "CAPTURE_MAX_SIZE_MB", 3)
    manager = capture.CaptureManager()
    manager.list_interfaces = lambda: [capture.CaptureInterface("1", "Ethernet", "test")]
    process = FakeProcess()
    commands = []
    monkeypatch.setattr(capture.subprocess, "Popen", lambda command, **kwargs: commands.append(command) or process)

    session = manager.start("1")

    assert session.interface_id == "1"
    command = commands[0]
    assert command[:5] == [str(tshark), "-i", "1", "-p", "-n"]
    assert "-a" in command and "duration:12" in command and "filesize:3072" in command
    assert "-w" in command
    manager.cleanup()


def test_capture_rejects_injection_like_interface_id(monkeypatch):
    manager = capture.CaptureManager()
    manager.list_interfaces = lambda: []

    with pytest.raises(HTTPException) as error:
        manager.start("1\n--bad-flag")
    assert error.value.status_code == 400


def test_capture_requires_positive_limits(monkeypatch):
    manager = capture.CaptureManager()
    manager.list_interfaces = lambda: [capture.CaptureInterface("1", "Ethernet", "test")]
    monkeypatch.setattr(capture.settings, "CAPTURE_DURATION_SECONDS", 0)

    with pytest.raises(HTTPException) as error:
        manager.start("1")
    assert error.value.status_code == 500


def test_hosted_capture_status_is_disabled(monkeypatch):
    monkeypatch.setattr(main.settings, "ENABLE_LOCAL_CAPTURE", False)

    response = main.capture_status()

    assert response.status == "disabled"
    assert "disabled" in response.error.lower()
