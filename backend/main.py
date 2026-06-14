from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.models import Station, TrackSection, Train
from backend.routes import auth, data, simulation
from backend.services.ai_service import ai_service
from backend.services.data_generator import run_db_initialization


@asynccontextmanager
async def lifespan(_: FastAPI):
    print("ASTRA Rail Backend starting up...")
    print("Verifying database and generating datasets if missing...")
    try:
        run_db_initialization()
        print("Database checking/generation complete.")
    except Exception as exc:
        print(f"Error during database initialization: {exc}")
        raise
    yield


app = FastAPI(
    title="ASTRA Rail Backend",
    description="Autonomous System for Train Risk Analysis and Response API",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.add_api_route(
    "/api/predict",
    simulation.run_scenario_step,
    methods=["POST"],
    tags=["prediction"],
)
app.add_api_route(
    "/api/analyze",
    simulation.run_autopilot_resolve,
    methods=["POST"],
    tags=["analysis"],
)

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    groq_configured = bool(ai_service.groq_key)
    mistral_configured = bool(ai_service.mistral_key)

    return {
        "status": "operational",
        "system": "ASTRA Rail",
        "deployment": "single-vercel-project",
        "database": {
            "status": "operational",
            "stations": db.query(Station).count(),
            "trains": db.query(Train).count(),
            "track_sections": db.query(TrackSection).count(),
        },
        "ai": {
            "groq_configured": groq_configured,
            "mistral_configured": mistral_configured,
            "demo_mode": not (groq_configured or mistral_configured),
        },
    }
