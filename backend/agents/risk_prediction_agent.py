from backend.agents.base_agent import BaseAgent

class RiskPredictionAgent(BaseAgent):
    def __init__(self, primary_service: str = "groq"):
        super().__init__(
            name="RiskPredictionAgent",
            role="Analyze compromised track telemetry, weather threats, and train schedules to calculate probability of derailments and disruptions.",
            primary_service=primary_service
        )
