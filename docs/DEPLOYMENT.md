# PacketLearner deployment preparation

This repository contains preparation artifacts only. Nothing in this document creates cloud resources, publishes the app, or uploads captures.

## Local verification

From `backend/`, run the offline backend suite:

```powershell
python -m pytest -q
```

From `frontend/`, run the existing checks:

```powershell
npm run lint
npm run build
```

## Container preparation

The root `docker-compose.cloud.yml` builds a FastAPI image with TShark for uploaded PCAP analysis and a static Vite/Nginx image. Before using it with an approved provider:

1. Set `CORS_ORIGINS` to the exact HTTPS frontend origin.
2. Set `VITE_API_URL` to the HTTPS public backend URL before building the frontend.
3. Provide `OPENAI_API_KEY` and `OPENAI_MODEL` through the host environment or the provider's secret manager when using OpenAI. Never put them in `frontend/` or a `VITE_` variable.
4. Keep upload and processing limits explicit (`MAX_UPLOAD_SIZE_MB`, `ANALYSIS_TIMEOUT_SECONDS`, and packet limits).
5. Terminate TLS at the hosting provider or a reverse proxy. Do not run Uvicorn with `--reload` in production.
6. Add authentication, rate limiting, durable storage policy, and an isolated worker before accepting untrusted public uploads.

The backend image defaults to `APP_ENV=production`, `ENABLE_LOCAL_CAPTURE=false`, and `HOST=0.0.0.0`. The capture routes report that local capture is disabled. This is intentional: a cloud machine cannot see or capture traffic from the user's PC. To use Phase 7, run the backend locally on the machine with the authorized interface and set `ENABLE_LOCAL_CAPTURE=true` in that local environment; do not expose that capture backend publicly without authentication and an explicit security design.

## Provider limitations

- OpenAI requires a server-side API key and model name. The frontend never receives the key.
- Ollama is a local provider. PacketLearner's Ollama URL remains loopback-only (`127.0.0.1`) and should be considered unavailable from the cloud image. Do not change it to a public endpoint unless the deployment has a separately secured, authorized Ollama service and an explicit review of that trust boundary.
- Neither provider receives PCAP files, raw packet payloads, or unrestricted packet info strings. The assistant receives bounded structured evidence only.

## Hosted deployment limitations

The current application has no authentication, persistent database, background job queue, object-storage lifecycle, or public-upload abuse controls. Those are required before a production internet deployment. The compose file is a build/run reference, not a production readiness certification.
