# PacketLearner

### Learn the Traffic. Understand the Threat.

**An AI-assisted network traffic analysis and cybersecurity learning platform designed to help beginners understand network packets, investigate suspicious traffic, and develop practical cybersecurity skills.**

---

## 📌 Project Overview

PacketLearner is a web-based network traffic analysis and cybersecurity learning platform that simplifies complex network packet information.

Traditional packet analysis tools such as Wireshark provide detailed network information, but beginners may find it difficult to understand protocols, packet relationships, communication patterns, and suspicious network activity.

PacketLearner aims to make this process easier through interactive visualizations, beginner-friendly explanations, evidence-based detection, and AI-assisted investigation.

Users will be able to upload existing Wireshark capture files or use a local capture agent for live network traffic analysis.

The platform will provide two main experiences:

- **Beginner Learning Mode:** Understand network protocols, packets, communication flows, and common network behaviors.
- **AI Investigation Assistant:** Explore suspicious traffic patterns, understand detection evidence, and receive recommendations for further investigation.

The project is being developed with a beginner-first approach while maintaining a foundation that can support more advanced cybersecurity workflows.

## 🎯 Project Objectives

- Simplify network packet analysis for cybersecurity beginners.
- Make network protocols easier to understand through visual explanations.
- Support PCAP and PCAPNG capture-file analysis.
- Provide a pathway to live network traffic analysis.
- Identify potentially suspicious network behavior using detection rules.
- Integrate AI to explain packet information and investigation findings.
- Help users develop practical network security and troubleshooting skills.
- Provide an interactive learning environment using real network traffic.

## ✨ Planned Features

### 1. User Authentication

- User registration and login.
- Secure password storage.
- Personal user dashboard.
- Individual capture history.
- User-specific capture access.
- Account management.

### 2. PCAP File Analysis

Users will be able to upload Wireshark capture files in supported formats.

Supported formats:

- `.pcap`
- `.pcapng`

The analysis engine will extract information such as:

- Source IP address.
- Destination IP address.
- Source port.
- Destination port.
- Protocol.
- Timestamp.
- Packet length.
- TCP flags.
- Packet metadata.
- Communication relationships.

### 3. Packet Explorer

An interactive interface for exploring captured network packets.

Planned capabilities:

- Search packets.
- Filter by protocol.
- Filter by source and destination IP.
- Filter by port number.
- Inspect individual packet metadata.
- View packet timestamps and lengths.
- Understand TCP flags and communication details.

### 4. Network Traffic Visualization

PacketLearner will transform packet information into visual representations.

Planned visualizations:

- Protocol distribution.
- Network traffic timeline.
- Source and destination IP analysis.
- Communication flow visualization.
- TCP handshake visualization.
- DNS request and response flow.
- Network traffic statistics.

### 5. Beginner Learning Mode

A dedicated learning experience for users who are new to networking and cybersecurity.

Topics include:

- TCP and UDP.
- DNS.
- DHCP.
- HTTP and HTTPS.
- TLS.
- ICMP.
- ARP.
- IP addressing.
- Ports and protocols.
- TCP three-way handshake.
- Network communication fundamentals.

The learning interface will explain:

- What happened?
- Why did it happen?
- Which protocol was involved?
- What information does the packet contain?
- Why is this information important?

### 6. Network Traffic Story

Instead of displaying only individual packets, PacketLearner will group related packets into understandable communication events.

Examples:

- DNS request and response.
- TCP three-way handshake.
- TLS handshake.
- Client-server communication.
- Repeated connection attempts.
- Potentially unusual network behavior.

The objective is to help beginners understand the sequence of events occurring across a network.

### 7. Suspicious Traffic Detection

The detection engine will identify potentially suspicious network patterns using evidence-based rules.

Planned detection scenarios:

- Potential port scanning.
- Repeated connection attempts.
- Unusual DNS activity.
- Unexpected communication patterns.
- Suspicious connection frequency.
- Potentially abnormal traffic behavior.

Each finding should include:

- Finding description.
- Relevant packet numbers.
- Timestamps.
- Source and destination information.
- Detection rule.
- Supporting evidence.
- Confidence or severity assessment.
- Recommended investigation steps.

**Important:** A suspicious pattern does not automatically indicate a confirmed attack. Findings must be presented as potential indicators and supported by evidence.

### 8. OpenAI Assistant

PacketLearner will integrate the OpenAI API to provide AI-assisted explanations and investigations.

The AI assistant will support two main capabilities.

**Learning Assistant**

- Explain packet information in simple English.
- Explain networking protocols.
- Describe TCP handshakes.
- Explain DNS communication.
- Answer questions about selected packets.
- Summarize network captures.

**Investigation Assistant**

- Explain suspicious traffic findings.
- Interpret detection evidence.
- Identify relevant packet relationships.
- Suggest additional investigation steps.
- Explain potential security implications.
- Assist with investigation report preparation.

The OpenAI Assistant will be available through a contextual interface and an expandable assistant panel.

### 9. Live Network Capture

Live packet capture is planned through a separate local capture agent.

The agent will use TShark to capture and decode traffic from a user's authorized network interface.

Planned capabilities:

- Start and stop capture.
- Select an available network interface.
- View incoming packet metadata.
- Monitor network traffic in near real time.
- Send structured packet information to the application.
- Display live traffic statistics.

A browser alone cannot capture all network traffic from the user's computer. Live capture therefore requires a local agent with explicit user permission.

### 10. Investigation Reports

Future reporting capabilities will include:

- Capture summary.
- Traffic statistics.
- Important packet evidence.
- Suspicious traffic findings.
- AI-assisted explanations.
- Investigation recommendations.
- Exportable PDF reports.

---

## 🏗️ System Architecture

PacketLearner will use a modular architecture separating the frontend, backend, packet-processing engine, detection engine, database, and AI integration.

### Architecture Flow

```text
                   USER
                     |
                     v
          REACT + TYPESCRIPT FRONTEND
                     |
                     v
                FASTAPI BACKEND
                     |
          +----------+----------+
          |                     |
          v                     v
     PCAP UPLOAD            LIVE CAPTURE
          |                     |
          v                     v
     FILE VALIDATION       LOCAL CAPTURE AGENT
          |                     |
          v                     v
        TSHARK                TSHARK
          |                     |
          +----------+----------+
                     |
                     v
              PACKET ANALYSIS
                     |
          +----------+----------+
          |                     |
          v                     v
    DETECTION ENGINE       TRAFFIC ANALYSIS
          |                     |
          +----------+----------+
                     |
                     v
             STRUCTURED EVIDENCE
                     |
          +----------+----------+
          |                     |
          v                     v
       POSTGRESQL           OPENAI API
          |                     |
          +----------+----------+
                     |
                     v
             FRONTEND RESULTS
```

### Architecture Principles

- Separate packet decoding from AI interpretation.
- Keep the detection engine independent of the AI assistant.
- Process uploaded captures in isolated workers.
- Send only relevant structured evidence to AI by default.
- Enforce user-level access controls.
- Keep the frontend independent of backend implementation details.
- Design the live capture agent as a separate component.

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Language | TypeScript | Frontend development |
| Styling | Tailwind CSS | Responsive design |
| UI Animation | Motion | Interface animations |
| 3D Background | Three.js | Network Universe background |
| React 3D | React Three Fiber | 3D scene integration |
| Icons | Lucide React | Interface icons |
| Charts | Recharts | Network visualizations |
| Backend | Python | Backend development |
| API Framework | FastAPI | REST APIs |
| Packet Decoder | TShark | Packet decoding and capture |
| Python Integration | PyShark | TShark integration |
| Packet Utilities | Scapy | Packet inspection and lab utilities |
| Database | PostgreSQL | Application data |
| Background Jobs | Celery | Asynchronous processing |
| Message Broker | Redis | Background task management |
| AI Integration | OpenAI API | AI explanations and investigation |
| Containerization | Docker | Application deployment |

---

## 📂 Project Structure

```text
PacketLearner/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dashboard/
│   │   ├── packet-explorer/
│   │   ├── beginner-mode/
│   │   ├── investigation/
│   │   ├── openai-assistant/
│   │   ├── background/
│   │   ├── services/
│   │   └── hooks/
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── analyzer/
│   │   ├── capture/
│   │   ├── detection/
│   │   ├── explanations/
│   │   ├── ai/
│   │   ├── database/
│   │   ├── reports/
│   │   └── security/
│   │
│   ├── tests/
│   ├── main.py
│   └── requirements.txt
│
├── capture-agent/
│   ├── capture/
│   ├── streaming/
│   └── main.py
│
├── sample_pcaps/
├── docs/
├── docker/
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## ⚙️ Installation and Setup

The following instructions describe the intended local development environment. Components will become available as they are implemented.

### Prerequisites

Install the following software:

- Python 3.11 or a compatible supported version.
- Node.js LTS.
- npm.
- Git.
- Visual Studio Code.
- Google Antigravity.
- PostgreSQL.
- Redis (for background processing).
- Wireshark with TShark.
- Docker Desktop (for containerized development).

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project:

```bash
cd PacketLearner
```

### 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload
```

If the backend entry point is `main.py` in the backend root instead, use:

```bash
uvicorn main:app --reload
```

API documentation will be available at:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend development URL will normally be:

```text
http://localhost:5173
```

### 4. Packet Analysis Setup

Install Wireshark and ensure TShark is available.

Check the installation:

```bash
tshark --version
```

If Windows cannot recognize the command, add the Wireshark installation directory to the system PATH or configure the TShark executable path in the backend environment.

### 5. Use the local Capture Agent (Phase 7)

Phase 7 captures only on the computer running the local FastAPI backend. Install Wireshark with TShark and its packet-capture driver (Npcap on Windows), start the backend and frontend, then open **Capture Agent** from the sidebar. Refresh the interface list, select an interface, and press **Start capture**. Press **Stop and analyze** when finished; the resulting temporary PCAPNG is passed to the existing `/api/captures/analyze` pipeline and then deleted.

The agent does not capture on startup, does not enable promiscuous mode by default, and does not send raw packet contents to OpenAI or another external service. Default limits are 60 seconds and 50 MB; configure `CAPTURE_DURATION_SECONDS` and `CAPTURE_MAX_SIZE_MB` in `backend/.env`. Capturing may require local administrator approval on Windows or capture permissions/capabilities on Linux and macOS. Capture only traffic you own or are explicitly authorized to inspect. If TShark or capture permissions are unavailable, the Capture Agent view shows an actionable error.

---

## 🔐 Environment Configuration

Create a `.env` file inside the backend directory.

Example:

```env
# Application
APP_NAME=PacketLearner
APP_ENV=development
DEBUG=true

# Backend
HOST=127.0.0.1
PORT=8000

# Database
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/packetlearner

# Redis
REDIS_URL=redis://localhost:6379/0

# OpenAI
ASSISTANT_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_TIMEOUT_SECONDS=30

# Optional local Ollama provider for the Assistant
# The backend always connects to http://127.0.0.1:11434/v1.
OLLAMA_MODEL=llama3.2:3b

# Packet Processing
TSHARK_PATH=YOUR_TSHARK_EXECUTABLE_PATH

# Security
SECRET_KEY=GENERATE_A_SECURE_RANDOM_SECRET
```

**Important:**

- Replace all placeholders with valid local configuration.
- Set `ASSISTANT_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL` in `backend/.env` to use OpenAI. Keep the key server-side and use a model supported by your OpenAI API account.
- To use local Ollama on Windows, install Ollama, start it, run `ollama pull llama3.2:3b`, set `ASSISTANT_PROVIDER=ollama` and `OLLAMA_MODEL=llama3.2:3b`, then restart the backend. Ollama is contacted only at `http://127.0.0.1:11434`; no Ollama API key is required and cloud/remote Ollama endpoints are not supported.
- Never commit `.env` files to GitHub.
- Never expose the OpenAI API key in frontend code.
- Do not share API keys through public repositories or screenshots.

---

## 🤖 AI Integration Design

PacketLearner will use the OpenAI API through the Python backend.

The AI will receive structured packet metadata and relevant detection evidence rather than unrestricted access to raw capture files.

### Local Assistant setup

1. Install backend dependencies with `pip install -r backend/requirements.txt`.
2. Copy `backend/.env.example` to `backend/.env`.
3. Choose `ASSISTANT_PROVIDER=openai` or `ASSISTANT_PROVIDER=ollama` in `backend/.env`. For OpenAI, set `OPENAI_API_KEY` and `OPENAI_MODEL`. For Ollama on Windows, install/start Ollama and run `ollama pull <local-model>`; then set `OLLAMA_MODEL=<local-model>`. Keep OpenAI credentials server-side; do not use a `VITE_` variable or paste the key into the frontend.
4. Start the FastAPI backend and open the **Assistant** view after loading a capture. The Settings view can switch the provider for the current browser session.

If the selected provider is not configured, Ollama is not running, or its model is not installed, the assistant returns a setup message and the frontend does not fabricate an answer. Requests contain only the user question, bounded conversation text, capture summary, selected packet metadata, and Phase 5 findings. PCAP/PCAPNG files, payloads, and unrestricted packet info strings are not sent to OpenAI or Ollama.

### Example Evidence Context

```json
{
  "capture_id": "capture_001",
  "question": "Explain this suspicious traffic",
  "findings": [
    {
      "rule": "POTENTIAL_PORT_SCAN",
      "source_ip": "192.168.1.10",
      "destination_ip": "192.168.1.20",
      "packet_numbers": [12, 13, 14],
      "description": "Multiple connection attempts to different ports"
    }
  ]
}
```

This is an illustrative example, not a confirmed detection result.

### Expected AI Response

The backend will validate AI responses against a structured schema.

Expected response fields:

- Summary.
- Explanation.
- Evidence references.
- Confidence.
- Limitations.
- Recommended next steps.

### AI Safety Principles

- AI must not invent packet numbers or IP addresses.
- AI must not claim an attack occurred without sufficient evidence.
- AI explanations must reference available evidence.
- AI must clearly identify uncertainty.
- Uploaded packet contents must be treated as untrusted data.
- Packet content must never override system or application instructions.
- Sensitive packet payloads must not be sent to AI by default.

---

## 🔍 Detection Engine

Phase 5 includes deterministic, AI-independent rules over lightweight TShark-decoded packet evidence:

- `PL-RULE-001` (`POTENTIAL_TCP_PORT_SCAN`): at least **5 TCP SYN-only packets** to **5 distinct destination ports** within a **10-second sliding window**.
- `PL-RULE-002` (`POTENTIAL_TCP_SYN_FLOOD`): at least **20 TCP SYN-only connection attempts** from one source to one destination within a **5-second sliding window**.
- `PL-RULE-003` (`POTENTIAL_UDP_PORT_SCAN`): at least **8 UDP packets** to **8 distinct destination ports** within a **10-second sliding window**.

Each finding includes the source and destination, observed ports, relative time window, packet count and IDs, an explanation, severity, and analyst follow-up steps. The UI labels these as potential findings; no rule confirms an attack. Evidence IDs link to returned packets in Packet Explorer when available; evidence beyond the bounded returned packet list remains represented in the finding and is marked as unavailable for direct inspection.

The detection catalog can grow independently of the UI:

| Detection | Description |
|---|---|
| Potential Port Scan | Multiple connection attempts across different ports |
| Potential TCP SYN Flood | Repeated SYN-only connection attempts to one destination |
| Potential UDP Port Scan | UDP probes across multiple destination ports |
| Unusual DNS Activity | Unusual DNS request patterns |
| Traffic Anomaly | Traffic behavior that differs from defined thresholds |
| Suspicious Communication | Network relationships requiring further investigation |

Limitations: these rules use relative capture time and decoded transport fields. They can miss slow scans, fragmented or malformed traffic, spoofed sources, and traffic where TShark cannot decode the relevant fields. Authorized vulnerability scanners, health checks, and unusual applications can still match them, so analysts should validate the source and correlate host, firewall, and IDS logs.

AI will explain findings, but the detection engine remains responsible for generating the underlying detection results.

---

## 🔒 Security Considerations

Security is a core requirement of PacketLearner.

Planned safeguards include:

1. Validate uploaded file formats and signatures.
2. Enforce upload size limits.
3. Process PCAP files in isolated, unprivileged environments.
4. Apply CPU, memory and processing-time limits.
5. Use safe subprocess execution.
6. Prevent unauthorized access to other users' captures.
7. Protect authentication credentials.
8. Use HTTPS in public deployments.
9. Sanitize user-controlled and packet-derived content before displaying it.
10. Avoid storing unnecessary packet payloads.
11. Protect environment variables and API credentials.
12. Implement capture retention and deletion controls.
13. Restrict live capture to explicitly authorized interfaces.
14. Validate AI-generated responses before presenting them as application output.

---

## 🎨 UI and Design Direction

PacketLearner will use a futuristic cybersecurity interface with a dark visual identity.

### Color Palette

| Color | Hex Code | Usage |
|---|---|---|
| Midnight Black | `#030407` | Main background |
| Neon Lime | `#D4FF24` | Highlights and active states |
| Electric Blue | `#1558C9` | Secondary accents |
| Dark Surface | `#151515` | Cards and panels |
| White | `#F5F5F5` | Primary text |
| Muted Grey | `#999999` | Secondary text |

### Design Characteristics

- Dark glassmorphism dashboard.
- Neon green highlights.
- Clean typography.
- Subtle borders and shadows.
- Responsive layouts.
- Smooth interface transitions.
- Interactive charts.
- Clear packet tables and detail panels.

### Network Universe Background

The website will use a custom animated background concept called **Network Universe**.

Planned visual elements:

- Rotating 3D particle Earth.
- Interconnected network nodes.
- Orbiting data paths.
- Subtle blue and neon green trails.
- Ambient lighting.
- Subtle mouse-based parallax.
- Smooth transitions.

The background will be optimized to avoid interfering with dashboard readability and performance. Reduced-motion and low-performance fallbacks will be provided.

---

## 🚀 Development Roadmap

| Phase | Development | Status |
|---|---|---|
| Phase 1 | Project foundation and environment setup | Planned |
| Phase 2 | PCAP upload and packet extraction | Planned |
| Phase 3 | Dashboard and packet visualization | Planned |
| Phase 4 | Beginner learning mode | Planned |
| Phase 5 | Detection engine and investigation | Planned |
| Phase 6 | OpenAI/Ollama Assistant | Implemented |
| Phase 7 | Live capture agent | Implemented locally |
| Phase 8 | Testing and cloud deployment preparation | Prepared |

### Minimum Viable Product (MVP)

The first usable version will prioritize:

- User registration and login.
- PCAP/PCAPNG upload.
- Packet metadata extraction.
- Packet Explorer.
- Protocol distribution charts.
- Beginner-friendly packet explanations.
- Basic suspicious traffic detection.
- OpenAI Assistant.

Live capture and public cloud deployment will follow once the core upload and analysis workflow is stable.

---

## 🧪 Testing Strategy

Testing will cover:

- PCAP file validation.
- Packet metadata extraction.
- Unsupported file formats.
- Large file handling.
- Malformed capture files.
- Detection rule accuracy.
- Authentication and authorization.
- User capture isolation.
- AI response validation.
- API error handling.
- Frontend responsiveness.
- Live capture permissions and connectivity.

Sample PCAP files should be used for repeatable testing. Only capture traffic that you own or are explicitly authorized to inspect.

The current offline backend suite uses mocked TShark, OpenAI, Ollama, and capture processes. From `backend/`, run `python -m pytest -q`. From `frontend/`, run `npm run lint` and `npm run build`. Frontend unit tests are not configured yet because the current Vite app has no test runner or component-test harness.

---

## 🌐 Deployment Strategy

PacketLearner is intended to support two deployment environments.

### Local Development

- Frontend and backend run locally.
- Local PostgreSQL database.
- Local packet processing through TShark.
- Local capture agent for authorized live traffic.
- Useful for development and cybersecurity learning.

### Public Cloud Deployment

- Hosted frontend.
- Hosted FastAPI backend.
- Managed PostgreSQL database.
- Background packet-processing workers.
- Secure AI API integration.
- Authenticated local capture-agent connectivity.

Cloud hosting does not automatically grant access to a user's local network traffic. The capture agent must establish an authenticated connection and receive explicit user authorization.

Phase 8 deployment preparation is documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), with container build definitions in `deploy/` and a non-publishing `docker-compose.cloud.yml` reference. Hosted defaults disable local TShark capture; run the Phase 7 backend locally on the computer whose traffic is being captured.

---

## 🤝 Contribution Guidelines

Contributions and suggestions are welcome.

A suggested contribution workflow:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your implementation.
5. Commit your changes with a clear message.
6. Open a pull request describing the changes.

Example:

```bash
git checkout -b feature/packet-explorer
```

Commit:

```bash
git add .
git commit -m "Add packet explorer functionality"
```

Push:

```bash
git push origin feature/packet-explorer
```

---

## 📚 Learning Resources

The following resources can help with the technologies used in PacketLearner:

- [Wireshark Documentation](https://www.wireshark.org/docs/)
- [TShark Documentation](https://www.wireshark.org/docs/man-pages/tshark.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Scapy Documentation](https://scapy.readthedocs.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)

---

## ⚠️ Disclaimer

PacketLearner is intended for educational, defensive cybersecurity, network troubleshooting, and authorized security investigation purposes.

Users must only capture, upload, and analyze network traffic they own or have explicit permission to inspect.

Detection results are indicators for further investigation and should not be treated as definitive proof of malicious activity.

PacketLearner is designed to complement existing network analysis tools, not replace them.

---

## 📄 License

A license has not yet been selected.

Before publishing the repository, choose an appropriate open-source or proprietary license and add its corresponding `LICENSE` file.

---

## 👨‍💻 Author

**PacketLearner**

*Learn the Traffic. Understand the Threat.*

Developed as a cybersecurity learning and network traffic analysis project.

---

**Project Status:** Development not yet started.

**Primary Focus:** AI-assisted network traffic analysis and beginner-friendly cybersecurity education.
