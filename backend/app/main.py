import os
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .analyzer import analyze_pcap_with_tshark, get_tshark_version, save_upload_to_temp
from .assistant import answer_question, configured_provider
from .config import settings
from .models import AnalysisResponse, AssistantConfigResponse, AssistantQuestionRequest, AssistantResponse, HealthResponse
from .capture import capture_manager
from .capture_models import CaptureInterfaceResponse, CaptureStartRequest, CaptureStatusResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify TShark on startup
    installed, path, version = get_tshark_version()
    if installed:
        print(f"[PacketLearner] TShark verified at: {path}")
        print(f"[PacketLearner] Version: {version}")
    else:
        print(f"[PacketLearner WARNING] TShark not found at configured path: {path}")
        print("[PacketLearner WARNING] Install Wireshark or set TSHARK_PATH in backend/.env")
    try:
        yield
    finally:
        capture_manager.cleanup()


app = FastAPI(
    title="PacketLearner API",
    description="Backend packet analysis service powered by Wireshark TShark",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS strictly for local development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def get_health() -> HealthResponse:
    """Return system and TShark status."""
    installed, path, version = get_tshark_version()
    return HealthResponse(
        status="ok",
        tshark_installed=installed,
        tshark_path=path,
        tshark_version=version,
    )


@app.post(
    "/api/captures/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
)
async def analyze_capture(
    file: UploadFile = File(..., description="PCAP or PCAPNG capture file (up to 50MB)"),
    max_packets: int = Query(
        settings.DEFAULT_PACKET_LIMIT,
        ge=1,
        le=settings.MAX_PACKET_LIMIT,
        description="Maximum number of individual packet records to return",
    ),
) -> AnalysisResponse:
    """
    Upload and analyze a Wireshark capture file (.pcap or .pcapng).
    Decodes packets with TShark, compiles capture metadata, protocol statistics,
    and top network talkers.
    """
    temp_path: Optional[str] = None
    try:
        # 1. Safely stream upload to a temporary file, verifying extension, size, and magic bytes
        temp_path, file_format, total_bytes = await save_upload_to_temp(file)

        # 2. Analyze the capture using TShark as a secured subprocess
        response = analyze_pcap_with_tshark(
            temp_path=temp_path,
            original_filename=file.filename or "capture.pcap",
            file_size_bytes=total_bytes,
            file_format=file_format,
            max_packets=max_packets,
        )

        return response

    finally:
        # Always remove temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except OSError:
                pass


@app.post(
    "/api/assistant/ask",
    response_model=AssistantResponse,
    status_code=status.HTTP_200_OK,
    tags=["OpenAI Assistant"],
)
async def ask_assistant(request: AssistantQuestionRequest) -> AssistantResponse:
    """Answer a beginner-friendly question from bounded capture evidence."""
    return await answer_question(request)


@app.get("/api/assistant/config", response_model=AssistantConfigResponse, tags=["Assistant"])
def get_assistant_config() -> AssistantConfigResponse:
    provider = configured_provider()
    return AssistantConfigResponse(
        provider=provider,
        model=settings.OPENAI_MODEL if provider == "openai" else settings.OLLAMA_MODEL,
        ollama_model=settings.OLLAMA_MODEL,
        ollama_base_url=settings.OLLAMA_BASE_URL,
    )


@app.get("/api/capture/interfaces", response_model=list[CaptureInterfaceResponse], tags=["Capture Agent"])
def capture_interfaces() -> list[CaptureInterfaceResponse]:
    return [CaptureInterfaceResponse(id=item.id, name=item.name, description=item.description) for item in capture_manager.list_interfaces()]


@app.get("/api/capture/status", response_model=CaptureStatusResponse, tags=["Capture Agent"])
def capture_status() -> CaptureStatusResponse:
    session, error = capture_manager.status()
    if session is None:
        return CaptureStatusResponse(status="error" if error else "idle", duration_limit_seconds=settings.CAPTURE_DURATION_SECONDS, max_size_mb=settings.CAPTURE_MAX_SIZE_MB, error=error)
    return CaptureStatusResponse(status="running" if session.process.poll() is None else "ready", interface_id=session.interface_id, started_at=None, elapsed_seconds=round(time.monotonic() - session.started_at, 1), duration_limit_seconds=settings.CAPTURE_DURATION_SECONDS, max_size_mb=settings.CAPTURE_MAX_SIZE_MB, error=error)


@app.post("/api/capture/start", response_model=CaptureStatusResponse, status_code=201, tags=["Capture Agent"])
def start_capture(request: CaptureStartRequest) -> CaptureStatusResponse:
    session = capture_manager.start(request.interface_id)
    return CaptureStatusResponse(status="running", interface_id=session.interface_id, elapsed_seconds=0, duration_limit_seconds=settings.CAPTURE_DURATION_SECONDS, max_size_mb=settings.CAPTURE_MAX_SIZE_MB)


@app.post("/api/capture/stop", response_model=AnalysisResponse, tags=["Capture Agent"])
def stop_capture(max_packets: int = Query(settings.DEFAULT_PACKET_LIMIT, ge=1, le=settings.MAX_PACKET_LIMIT)) -> AnalysisResponse:
    path = capture_manager.stop()
    try:
        return analyze_pcap_with_tshark(path, path.name, path.stat().st_size, "pcapng", max_packets)
    finally:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
