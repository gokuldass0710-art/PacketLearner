# PacketLearner Backend

FastAPI packet-analysis service powered by Wireshark's TShark decoder.

## Prerequisites

- **Python 3.10+**
- **Wireshark with TShark**
  - Windows: default installation at `C:\Program Files\Wireshark\tshark.exe`
  - Linux: `sudo apt install tshark`
  - macOS: `brew install wireshark`

## Quick Start

### 1. Create and Activate Virtual Environment

```powershell
# From the backend/ directory
python -m venv venv
.\venv\Scripts\Activate.ps1
```

*(On Linux / macOS: `source venv/bin/activate`)*

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` if custom paths are needed:

```powershell
cp .env.example .env
```

If TShark is installed in a non-standard location, set `TSHARK_PATH` in `.env`:

```env
TSHARK_PATH=C:\CustomPath\Wireshark\tshark.exe
```

### 4. Start the Backend Server

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:
- **Interactive OpenAPI Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Analysis Endpoint:** `POST http://127.0.0.1:8000/api/captures/analyze`

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Verifies service status and TShark binary availability |
| `POST` | `/api/captures/analyze` | Accepts `.pcap` or `.pcapng` (multipart/form-data) up to 50MB and returns parsed metadata, packet records, protocol statistics, and top talkers |
