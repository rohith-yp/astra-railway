from backend.agents.base_agent import BaseAgent

class TrainOperationsAgent(BaseAgent):
    def __init__(self, primary_service: str = "groq"):
        super().__init__(
            name="TrainOperationsAgent",
            role="Optimize train routes, issue digital speed reduction commands, and coordinate timetable variations to prevent operational gridlocks.",
            primary_service=primary_service
        )
