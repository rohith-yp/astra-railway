from backend.agents.base_agent import BaseAgent

class CrowdIntelligenceAgent(BaseAgent):
    def __init__(self, primary_service: str = "groq"):
        super().__init__(
            name="CrowdIntelligenceAgent",
            role="Monitor crowd densities at platforms and station hubs, predict congestion zones, and recommend foot-traffic redistribution plans.",
            primary_service=primary_service
        )
