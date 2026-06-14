import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.services.ai_service import ai_service

router = APIRouter()

class APIKeyRequest(BaseModel):
    groq_api_key: str
    mistral_api_key: str

class VerificationResponse(BaseModel):
    groq_connected: bool
    mistral_connected: bool
    demo_mode: bool
    message: str

def write_keys_to_env(groq_key: str, mistral_key: str):
    """
    Safely writes keys to .env files in both backend/ and project root.
    """
    env_content = f"GROQ_API_KEY={groq_key}\nMISTRAL_API_KEY={mistral_key}\n"
    
    # Write to backend/.env
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_env = os.path.join(backend_dir, ".env")
    with open(backend_env, "w") as f:
        f.write(env_content)
        
    # Write to workspace root .env
    root_env = os.path.join(os.path.dirname(backend_dir), ".env")
    with open(root_env, "w") as f:
        f.write(env_content)

@router.post("/verify-keys", response_model=VerificationResponse)
async def verify_keys(payload: APIKeyRequest):
    groq_ok = False
    mistral_ok = False
    
    if payload.groq_api_key:
        groq_ok = await ai_service.verify_groq(payload.groq_api_key)
        
    if payload.mistral_api_key:
        mistral_ok = await ai_service.verify_mistral(payload.mistral_api_key)
        
    # Write to environment file
    write_keys_to_env(payload.groq_api_key, payload.mistral_api_key)
    
    # Reload keys in memory
    ai_service.refresh_keys()
    
    demo = not (groq_ok and mistral_ok)
    
    status_msg = ""
    if groq_ok:
        status_msg += "Groq Connected. "
    else:
        status_msg += "Groq Unreachable (Using Simulated Fallback). "
        
    if mistral_ok:
        status_msg += "Mistral Connected."
    else:
        status_msg += "Mistral Unreachable (Using Simulated Fallback)."
        
    return VerificationResponse(
        groq_connected=groq_ok,
        mistral_connected=mistral_ok,
        demo_mode=demo,
        message=status_msg
    )

@router.get("/status", response_model=VerificationResponse)
async def get_api_status():
    """
    Checks connection statuses using currently loaded env keys.
    """
    groq_ok = await ai_service.verify_groq()
    mistral_ok = await ai_service.verify_mistral()
    
    demo = not (groq_ok or mistral_ok)
    status_msg = ""
    if groq_ok:
        status_msg += "Groq Connected. "
    else:
        status_msg += "Groq disconnected. "
        
    if mistral_ok:
        status_msg += "Mistral Connected."
    else:
        status_msg += "Mistral disconnected."
        
    return VerificationResponse(
        groq_connected=groq_ok,
        mistral_connected=mistral_ok,
        demo_mode=demo,
        message=status_msg
    )
