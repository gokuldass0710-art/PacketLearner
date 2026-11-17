"""Local, explicitly-started TShark capture lifecycle management."""

from __future__ import annotations

import os
import signal
import subprocess
import tempfile
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, status

from .config import settings


@dataclass(frozen=True)
class CaptureInterface:
    id: str
    name: str
    description: str


@dataclass
class CaptureSession:
    process: subprocess.Popen[bytes]
    path: Path
    interface_id: str
    started_at: float


class CaptureManager:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._session: Optional[CaptureSession] = None
        self._last_error: Optional[str] = None
        self._temp_dir = Path(tempfile.gettempdir()) / "packetlearner-captures"
        self._temp_dir.mkdir(mode=0o700, parents=True, exist_ok=True)

    def list_interfaces(self) -> list[CaptureInterface]:
        if not os.path.isfile(settings.TSHARK_PATH):
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=self._missing_tshark_message())
        try:
            proc = subprocess.run(
                [settings.TSHARK_PATH, "-D"], capture_output=True, text=True,
                encoding="utf-8", errors="replace", timeout=5, shell=False,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise HTTPException(status_code=503, detail=f"Unable to list capture interfaces: {exc}") from exc
        if proc.returncode != 0:
            detail = proc.stderr.strip().splitlines()[-1] if proc.stderr.strip() else "TShark could not list capture interfaces."
            raise HTTPException(status_code=503, detail=detail)

        interfaces: list[CaptureInterface] = []
        for line in proc.stdout.splitlines():
            line = line.strip()
            if not line or ". " not in line:
                continue
            interface_id, remainder = line.split(". ", 1)
            name, separator, description = remainder.partition(" (")
            interfaces.append(CaptureInterface(interface_id.strip(), name.strip(), description[:-1] if separator and description.endswith(")") else description.strip()))
        return interfaces

    def start(self, interface_id: str) -> CaptureSession:
        with self._lock:
            self._refresh_finished_process()
            if self._session is not None:
                raise HTTPException(status_code=409, detail="A capture is already running. Stop it before starting another.")
            if not interface_id or len(interface_id) > 128 or any(char in interface_id for char in "\r\n\x00"):
                raise HTTPException(status_code=400, detail="Choose a valid local capture interface.")
            interfaces = self.list_interfaces()
            if not any(item.id == interface_id for item in interfaces):
                raise HTTPException(status_code=400, detail="The selected capture interface is not available.")
            if settings.CAPTURE_DURATION_SECONDS < 1 or settings.CAPTURE_MAX_SIZE_MB < 1:
                raise HTTPException(status_code=500, detail="Capture duration and file-size limits must be positive.")

            filename = f"capture-{uuid.uuid4().hex}.pcapng"
            path = self._temp_dir / filename
            command = [
                settings.TSHARK_PATH, "-i", interface_id, "-p", "-n", "-w", str(path),
                "-a", f"duration:{settings.CAPTURE_DURATION_SECONDS}",
                "-a", f"filesize:{settings.CAPTURE_MAX_SIZE_MB * 1024}",
            ]
            try:
                process = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, shell=False)
            except OSError as exc:
                raise HTTPException(status_code=503, detail=f"Unable to start TShark capture. Check permissions and Wireshark installation: {exc}") from exc

            self._last_error = None
            self._session = CaptureSession(process=process, path=path, interface_id=interface_id, started_at=time.monotonic())
            return self._session

    def status(self) -> tuple[Optional[CaptureSession], Optional[str]]:
        with self._lock:
            self._refresh_finished_process()
            return self._session, self._last_error

    def stop(self) -> Path:
        with self._lock:
            session = self._session
            if session is None:
                raise HTTPException(status_code=409, detail="No capture is currently running.")
            self._terminate(session.process)
            self._session = None
            if session.process.returncode not in (0, 1, -signal.SIGINT) and not session.path.exists():
                self._last_error = self._stderr(session.process) or "TShark stopped without producing a capture file."
            if not session.path.exists() or session.path.stat().st_size == 0:
                self._last_error = self._stderr(session.process) or "No packets were captured. Check the interface and capture permissions."
                self._safe_delete(session.path)
                raise HTTPException(status_code=422, detail=self._last_error)
            return session.path

    def cleanup(self) -> None:
        with self._lock:
            if self._session is not None:
                self._terminate(self._session.process)
                self._safe_delete(self._session.path)
                self._session = None

    def _refresh_finished_process(self) -> None:
        if self._session is not None and self._session.process.poll() is not None:
            if self._session.process.returncode not in (0, 1):
                self._last_error = self._stderr(self._session.process) or "TShark capture stopped unexpectedly."

    @staticmethod
    def _terminate(process: subprocess.Popen[bytes]) -> None:
        if process.poll() is None:
            if os.name == "nt":
                process.terminate()
            else:
                process.send_signal(signal.SIGINT)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)

    @staticmethod
    def _stderr(process: subprocess.Popen[bytes]) -> str:
        if process.stderr is None:
            return ""
        try:
            output = process.stderr.read().decode("utf-8", errors="replace")
        except (OSError, AttributeError):
            return ""
        return output.strip().splitlines()[-1] if output.strip() else ""

    @staticmethod
    def _safe_delete(path: Path) -> None:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass

    @staticmethod
    def _missing_tshark_message() -> str:
        return f"TShark executable not found at '{settings.TSHARK_PATH}'. Install Wireshark/TShark or set TSHARK_PATH in backend/.env."


capture_manager = CaptureManager()
