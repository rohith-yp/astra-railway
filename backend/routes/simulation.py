from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.database.connection import get_db
from backend.services.simulator import simulator

router = APIRouter()

class SimulationStepRequest(BaseModel):
    scenario_type: str  # A-42-fracture, flood, overcrowding, signal-failure
    step: int           # 1 to 6

class ScenarioResponse(BaseModel):
    id: str
    name: str
    description: str
    affected_elements: str
    severity: str

@router.get("/scenarios", response_model=List[ScenarioResponse])
def get_available_scenarios():
    """
    Returns available mock/predefined risk scenarios.
    """
    return [
        ScenarioResponse(
            id="A-42-fracture",
            name="Track Section A-42 Anomaly (Micro-fracture)",
            description="A thermal sensor reports micro-fracturing on Section A-42. High derailment threat for Vande Bharat Express (Train 22436) if speed is not reduced.",
            affected_elements="Section A-42, Vande Bharat Express",
            severity="CRITICAL"
        ),
        ScenarioResponse(
            id="flood",
            name="Monsoon Track Submergence (Patna Outer)",
            description="Severe rainfall floods the Patna outer bypass line. High hazard of signal shorts and track bed damage for incoming Patna Rajdhani (Train 12309).",
            affected_elements="Section SEC-088, Patna Rajdhani",
            severity="MAJOR"
        ),
        ScenarioResponse(
            id="overcrowding",
            name="NDLS Platform 4 Gridlock (Overcrowding)",
            description=" cascading delays trigger extreme passenger concentration at New Delhi Platform 4. Crowds reach 4.2 passengers/sqm, posing track-fall safety threats.",
            affected_elements="NDLS Platform 4, New Delhi Shatabdi",
            severity="MAJOR"
        ),
        ScenarioResponse(
            id="signal-failure",
            name="Mumbai-Surat Automatic Signaling Lockout",
            description="Automatic block signaling locking on Mumbai-Surat trunk route due to substation relay short. Rear-end collision threat for trailing Vande Bharat.",
            affected_elements="Section SEC-012, Train 22436",
            severity="CRITICAL"
        )
    ]

@router.post("/run-step")
async def run_scenario_step(payload: SimulationStepRequest, db: Session = Depends(get_db)):
    """
    Executes a single step in the agent coordination loop.
    """
    if payload.step < 1 or payload.step > 6:
        raise HTTPException(status_code=400, detail="Step count must be between 1 and 6.")
        
    try:
        result = await simulator.run_scenario_step(payload.scenario_type, payload.step, db)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        print(f"Error in run_scenario_step route: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class AutopilotRequest(BaseModel):
    scenario_type: str
    custom_description: str = None

@router.post("/autopilot-resolve")
async def run_autopilot_resolve(payload: AutopilotRequest, db: Session = Depends(get_db)):
    """
    Executes a dual-model (Groq + Mistral) concurrent simulation resolution.
    """
    try:
        result = await simulator.run_autopilot_combination(payload.scenario_type, db, payload.custom_description)
        return result
    except Exception as e:
        print(f"Error in run_autopilot_resolve route: {e}")
        raise HTTPException(status_code=500, detail=str(e))
