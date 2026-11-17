import os
import shutil
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env in backend directory or root
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / ".env")
load_dotenv(backend_dir.parent / ".env")

def get_default_tshark_path() -> str:
    """Determine the default TShark executable path based on platform."""
    # 1. Check explicit environment variable
    env_path = os.getenv("TSHARK_PATH")
    if env_path and os.path.isfile(env_path):
        return env_path

    # 2. On Windows, check standard Wireshark install path
    if sys.platform == "win32":
        default_win = r"C:\Program Files\Wireshark\tshark.exe"
        if os.path.isfile(default_win):
            return default_win

    # 3. Check system PATH
    which_path = shutil.which("tshark")
    if which_path:
        return which_path

    # Fallback to standard path on Windows or POSIX
    return r"C:\Program Files\Wireshark\tshark.exe" if sys.platform == "win32" else "/usr/bin/tshark"


class Settings:
    TSHARK_PATH: str = os.getenv("TSHARK_PATH", get_default_tshark_path())
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    ANALYSIS_TIMEOUT_SECONDS: int = int(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "30"))
    DEFAULT_PACKET_LIMIT: int = int(os.getenv("DEFAULT_PACKET_LIMIT", "1000"))
    MAX_PACKET_LIMIT: int = int(os.getenv("MAX_PACKET_LIMIT", "5000"))
    CAPTURE_DURATION_SECONDS: int = int(os.getenv("CAPTURE_DURATION_SECONDS", "60"))
    CAPTURE_MAX_SIZE_MB: int = int(os.getenv("CAPTURE_MAX_SIZE_MB", "50"))
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "")
    OPENAI_TIMEOUT_SECONDS: int = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "30"))
    ASSISTANT_PROVIDER: str = os.getenv("ASSISTANT_PROVIDER", "openai").strip().lower()
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b").strip()
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434/v1"

    # CORS origins restricted to local development Vite / frontend
    raw_cors = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    )
    CORS_ORIGINS: list[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]


settings = Settings()
