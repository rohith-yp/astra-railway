import json
from typing import Dict, Any
from backend.services.ai_service import ai_service

class BaseAgent:
    def __init__(self, name: str, role: str, primary_service: str = "groq"):
        self.name = name
        self.role = role
        self.primary_service = primary_service

    def get_system_instruction(self) -> str:
        return f"""You are the {self.name}, an autonomous AI agent operating as part of the ASTRA Rail (Autonomous System for Train Risk Analysis and Response) network.
Your role is: {self.role}.

You MUST think, analyze, decide, communicate, coordinate, and act in response to incidents.
You MUST output your response strictly as a JSON object with the following fields:
{{
  "thought": "Your internal reasoning and considerations",
  "analysis": "Quantitative or qualitative analysis of the sensor or state input",
  "decision": "Decisive steps or strategy selected",
  "communication": "Messages or warning notices to send to passengers or dashboard",
  "coordination": "Action requests directed at other agents in the network",
  "action": "Concrete system action executed in the database or train control"
}}

Do not include any introductory or concluding text, only return the JSON object."""

    def get_prompt(self, context: Dict[str, Any]) -> str:
        return f"""Given the following railway state and sensor context:
{json.dumps(context, indent=2)}

Perform your agent analysis. Detail your thoughts, decisions, communications, coordinations, and actions. Remember to format the output as JSON."""

    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs the agent step. Queries Groq/Mistral, or falls back to Demo Mode if key is invalid or absent.
        """
        system_inst = self.get_system_instruction()
        prompt = self.get_prompt(context)
        
        # Call LLM
        response_text = await ai_service.call_llm(prompt, system_inst, self.primary_service)
        
        if response_text == "FALLBACK_DEMO":
            # Switch to Demo AI Mode
            print(f"[{self.name}] Switching to Demo AI Mode...")
            return ai_service.get_fallback_monologue(self.name, context)
            
        try:
            # Clean response text if there is leading/trailing markdown code blocks
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            parsed = json.loads(clean_text)
            
            # Ensure all required keys exist
            required_keys = ["thought", "analysis", "decision", "communication", "coordination", "action"]
            for key in required_keys:
                if key not in parsed:
                    parsed[key] = f"Automatic execution of {key} in response to status."
            return parsed
            
        except Exception as e:
            print(f"Error parsing LLM response for agent {self.name}: {e}. Raw: {response_text}")
            # Fallback to demo monologue
            return ai_service.get_fallback_monologue(self.name, context)
