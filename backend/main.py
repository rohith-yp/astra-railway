import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routes import auth, data, simulation
from backend.services.data_generator import run_db_initialization

app = FastAPI(
    title="ASTRA Rail Backend",
    description="Autonomous System for Train Risk Analysis and Response API",
    version="1.0.0"
)

# CORS setup for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock down origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])

@app.on_event("startup")
def startup_event():
    print("ASTRA Rail Backend starting up...")
    print("Verifying database and generating datasets if missing...")
    try:
        run_db_initialization()
        print("Database checking/generation complete.")
    except Exception as e:
        print(f"Error during database initialization: {e}")

@app.get("/api/health")
def health_check():
    return {"status": "operational", "system": "ASTRA Rail"}

# Serve static assets from frontend build
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{catchall:path}")
def serve_frontend(catchall: str):
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "status": "waiting_for_assets",
        "message": "Frontend static assets not compiled. Please run npm run build inside frontend/ directory."
    }

