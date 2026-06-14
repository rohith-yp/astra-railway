# ASTRA Rail: Autonomous System for Train Risk Analysis & Response

> **Predict. Prevent. Protect.**

ASTRA Rail is a production-grade autonomous railway intelligence platform. It demonstrates how a network of cooperative Agentic AI models (Track Health, Risk Prediction, Crowd Intelligence, Train Operations, Emergency Response, and Passenger Communication agents) think, analyze, decide, and act autonomously to intercept and prevent railway incidents.

---

## Technical Stack

- **Frontend**: React 18, Vite, TypeScript
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Uvicorn
- **AI Core**: Groq API (llama-3.3-70b) + Mistral API (mistral-large) — auto-fallback to Demo Mode
- **Database**: SQLite (auto-seeded with 16,000+ realistic records on first boot)

---

## Architecture: Single Service

The frontend React app is **built into static files** and served directly by the FastAPI backend. There is **one URL**, **one server**, **one deployment**.

```
http://your-domain.com/          → React Frontend (served as static files)
http://your-domain.com/api/...   → FastAPI Backend routes
```

---

## Running Locally

### 1. Start the backend (serves everything on port 8000)

```bash
cd C:\Users\Rohith\OneDrive\Desktop\astra-rail
python -m uvicorn backend.main:app --reload --port 8000
```

Open: **http://localhost:8000**

### 2. (Optional) Rebuild the frontend after code changes

```bash
cd frontend
..\node-portable\node-v20.12.2-win-x64\npm.cmd run build
```

Then restart the backend server.

### Fix "port already in use" error

```powershell
# Kill existing process on port 8000
(Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object { taskkill /PID $_ /F }
# Then start fresh
python -m uvicorn backend.main:app --reload --port 8000
```

---

## Deploying (One Website — One Click)

### Option 1: Railway.app (Recommended — Free)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Railway auto-reads `nixpacks.toml`:
   - Installs Node 20 + Python 3.11
   - Builds the React frontend (`npm run build`)
   - Starts the FastAPI server
4. In Railway dashboard → Variables, add:
   - `GROQ_API_KEY` = your key
   - `MISTRAL_API_KEY` = your key
5. Done — you get a single `https://your-app.railway.app` URL

### Option 2: Render.com (Free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect GitHub repo
3. Render auto-reads `render.yaml`:
   - Build command: `pip install -r requirements.txt && cd frontend && npm install && npm run build`
   - Start command: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables: `GROQ_API_KEY`, `MISTRAL_API_KEY`
5. Done — single `https://astra-rail.onrender.com` URL

---

## API Keys (Optional)

Without keys the system runs in **Demo AI Mode** with pre-scripted realistic responses. To enable live Groq + Mistral AI:

```env
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
```

Add these to `backend/.env` locally or as environment variables on your deployment platform.

---

## Agent Coordination Workflow

1. **Track Health Agent** — Detects micro-fracture on Section A-42 via sensor telemetry
2. **Risk Prediction Agent** — Calculates **87% derailment probability**
3. **Train Operations Agent** — Caps Vande Bharat Express speed to **40 km/h**
4. **Emergency Response Agent** — Dispatches Track Engineering Crew Delta
5. **Passenger Communication Agent** — Broadcasts delay SMS + platform alerts
6. **Crowd Intelligence Agent** — Redirects crowd bottlenecks at NDLS
7. **Crisis Averted** — Incident status set to **PREVENTED**, track health restored
