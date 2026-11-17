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
| `POST` | `/api/captures/analyze` | Accepts `.pcap` or `.pcapng` (multipart/form-data) up to 50MB and returns parsed metadata, packet records, protocol statistics, top talkers, and rule-based findings |
| `GET` | `/api/capture/interfaces` | Lists local interfaces reported by TShark |
| `GET` | `/api/capture/status` | Returns local capture state, elapsed time, and configured limits |
| `POST` | `/api/capture/start` | Explicitly starts one bounded local capture for a selected interface |
| `POST` | `/api/capture/stop` | Stops the local capture, analyzes its temporary PCAPNG through the existing analyzer, and deletes the file |
| `GET` | `/api/assistant/config` | Returns the configured assistant provider and non-secret model information |

## Phase 7 local capture

The capture agent is part of the FastAPI process and runs only on the machine hosting this backend. The frontend cannot capture packets by itself. Open the frontend's **Capture Agent** view, choose an interface, and press **Start capture**. No capture process is started on page load. **Stop and analyze** sends the generated local PCAPNG through the existing analyzer; raw packet contents are not sent to OpenAI or another external service.

TShark is started with address resolution disabled (`-n`) and promiscuous mode disabled (`-p`). The capture stops when the user stops it, the configured duration is reached, or the configured file-size limit is reached. Temporary files are stored under the operating system temporary directory in `packetlearner-captures`, use generated names, and are removed after analysis or backend shutdown.

On Windows, packet capture may require running the backend with the permissions granted by the Npcap/Wireshark installation. On Linux, the user may need capture capabilities or an appropriately configured `dumpcap` group; avoid running the whole application as root where possible. If TShark, an interface, or the required permission is unavailable, the UI displays the returned error and no capture is started.

## Assistant providers

OpenAI remains the default provider. Keep `OPENAI_API_KEY` and `OPENAI_MODEL` only in `backend/.env`. To use local Ollama on Windows, install Ollama, start the Ollama application/service, download a model such as `ollama pull llama3.2:3b`, and set `ASSISTANT_PROVIDER=ollama` and `OLLAMA_MODEL=llama3.2:3b`. PacketLearner connects only to `http://127.0.0.1:11434/v1`; the Ollama URL is intentionally not configurable, so Ollama cloud or remote hosts are not supported. Ollama does not require an API key.

The frontend Settings view also lets the current browser session choose OpenAI or Local Ollama. The selected provider is sent as a non-secret request preference; credentials remain server-side. If Ollama is stopped or the configured model is not installed, the Assistant returns a clear setup message. Only the existing bounded question, conversation, capture summary, selected packet metadata, and detection findings are sent; PCAP files, payloads, and raw packet contents are never sent.

### Detection rule

`PL-RULE-001` (`POTENTIAL_TCP_PORT_SCAN`) groups decoded TCP SYN packets by source and destination IP. It reports a potential finding only when the group contains at least 5 SYN packets to 5 distinct destination ports within a 10-second sliding window. The thresholds are named constants in `app/detection.py`. Findings include packet IDs and relative timing so the frontend can show the supporting evidence. This is an indicator for investigation, not confirmation of an attack; slow scans, malformed traffic, and authorized scanners may be missed or may match.
