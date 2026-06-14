from backend.agents.base_agent import BaseAgent

class TrackHealthAgent(BaseAgent):
    def __init__(self, primary_service: str = "groq"):
        super().__init__(
            name="TrackHealthAgent",
            role="Detect track anomalies, monitor structural scores, predict physical wear failures, and generate maintenance tickets.",
            primary_service=primary_service
        )
