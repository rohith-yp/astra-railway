from backend.agents.base_agent import BaseAgent

class PassengerCommunicationAgent(BaseAgent):
    def __init__(self, primary_service: str = "groq"):
        super().__init__(
            name="PassengerCommunicationAgent",
            role="Communicate critical safety announcements, train delays, routing adjustments, and emergency evacuation details to passengers and station systems.",
            primary_service=primary_service
        )
