from backend.agents.base_agent import BaseAgent

class EmergencyResponseAgent(BaseAgent):
    def __init__(self, primary_service: str = "groq"):
        super().__init__(
            name="EmergencyResponseAgent",
            role="Analyze incidents, assign emergency response forces, dispatch repair crews, and manage recovery/rescue logistics.",
            primary_service=primary_service
        )
