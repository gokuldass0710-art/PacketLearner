import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .analyzer import analyze_pcap_with_tshark, get_tshark_version, save_upload_to_temp
from .assistant import answer_question
from .config import settings
from .models import AnalysisResponse, AssistantQuestionRequest, AssistantResponse, HealthResponse


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
    yield


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
