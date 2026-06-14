from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.ai_service import ai_service

router = APIRouter()

class VerificationResponse(BaseModel):
    groq_connected: bool
    mistral_connected: bool
    demo_mode: bool
    message: str

@router.post("/verify-keys", response_model=VerificationResponse)
async def verify_keys():
    """Verify credentials supplied through server environment variables."""
    ai_service.refresh_keys()
    groq_ok = await ai_service.verify_groq()
    mistral_ok = await ai_service.verify_mistral()
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
