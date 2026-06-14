import os
import json
import httpx
from dotenv import load_dotenv

# Local .env files are for development only. Vercel injects production values
# into the process environment.
load_dotenv()

class AIService:
    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.mistral_key = os.getenv("MISTRAL_API_KEY")
        
    def refresh_keys(self):
        load_dotenv()
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.mistral_key = os.getenv("MISTRAL_API_KEY")

    def has_active_api(self) -> bool:
        return bool(self.groq_key or self.mistral_key)

    async def verify_groq(self, custom_key: str = None) -> bool:
        key = custom_key or self.groq_key
        if not key:
            return False
        
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": "Ping"}],
            "max_tokens": 5
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(url, headers=headers, json=data)
                return response.status_code == 200
        except Exception as e:
            print(f"Groq verification failed: {e}")
            return False

    async def verify_mistral(self, custom_key: str = None) -> bool:
        key = custom_key or self.mistral_key
        if not key:
            return False
        
        url = "https://api.mistral.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "mistral-small-latest",
            "messages": [{"role": "user", "content": "Ping"}],
            "max_tokens": 5
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(url, headers=headers, json=data)
                return response.status_code == 200
        except Exception as e:
            print(f"Mistral verification failed: {e}")
            return False

    async def call_llm(self, prompt: str, system_instruction: str = None, service: str = "groq") -> str:
        """
        Attempts to call the real LLM (Groq or Mistral). Falls back to Demo Mode on failure.
        """
        # Pick api key and URL
        key = self.groq_key if service == "groq" else self.mistral_key
        # Check fallback
        if not key:
            # Try the other key if available
            if service == "groq" and self.mistral_key:
                service = "mistral"
                key = self.mistral_key
            elif service == "mistral" and self.groq_key:
                service = "groq"
                key = self.groq_key
            else:
                return "FALLBACK_DEMO"
        
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        if service == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
            data = {
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
        else: # mistral
            url = "https://api.mistral.ai/v1/chat/completions"
            data = {
                "model": "mistral-large-latest",
                "messages": messages,
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=data)
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
                else:
                    print(f"LLM call failed with code {response.status_code}: {response.text}")
                    return "FALLBACK_DEMO"
        except Exception as e:
            print(f"LLM API request exception: {e}")
            return "FALLBACK_DEMO"

    def get_fallback_monologue(self, agent_name: str, scenario_data: dict) -> dict:
        """
        Generates realistic structured agent monologues matching the schema.
        Used when in Demo Mode.
        """
        section = scenario_data.get("section", "A-42")
        defect = scenario_data.get("defect", "micro-fracture")
        station = scenario_data.get("station", "NDLS")
        platform = scenario_data.get("platform", 4)
        
        fallback_map = {
            "TrackHealthAgent": {
                "thought": f"Scanning sensor outputs for Track Section {section}. High vibration spikes (8.7 Gs) and telemetry discrepancies indicate immediate structural fatigue. Cross-referencing stress thresholds.",
                "analysis": f"Vibration score: {scenario_data.get('vibration_level', 8.7)} Gs. Thermal score: 49.5°C. Geometry anomaly detected. An active {defect} is expanding under heat load.",
                "decision": f"Declare critical defect on Section {section}. Propose emergency rail maintenance and request immediate speed reductions to avoid derailment risk.",
                "communication": f"Broadcasting alert to Risk Prediction Agent and Operations: Section {section} structural integrity compromised.",
                "coordination": "Requesting Risk Prediction Agent to compute derailment index, and Train Operations Agent to enforce emergency speed locks.",
                "action": f"Flagged Track Section {section} status in database as 'Needs Maintenance'. Raised emergency ticket ID: MAINT-{section}-99."
            },
            "RiskPredictionAgent": {
                "thought": f"Analyzing compromised telemetry on Section {section} sent by Track Health Agent. Correlating current track degradation indicators with ambient traffic density and weight loads.",
                "analysis": f"Active {defect} coupled with thermal expansion (49.5°C) and vibration frequency (8.7 Gs) yields a 87% derailment probability for trains exceeding 60 km/h.",
                "decision": f"Escalate risk rating of Section {section} to level CRITICAL. Calculate maximum safe speed threshold as 40 km/h.",
                "communication": "Sent emergency threat matrix to Train Operations Agent, Emergency Response, and Passenger Comm systems.",
                "coordination": "Instruct Train Operations Agent to implement speed restrictions immediately. Notify Emergency Response for fast crew staging.",
                "action": f"Logged high-risk hazard ticket INC-A42-001 in registry. Severity set to CRITICAL. Derailment probability verified: 87%."
            },
            "TrainOperationsAgent": {
                "thought": "Emergency alert received from Risk Prediction Agent. Checking GPS tracking data for active trains scheduled or currently traversing route section A-42.",
                "analysis": "Train 22436 (Vande Bharat Express) is currently 12km away from Section A-42, cruising at 110 km/h. Multiple mail/express trains are following on this route.",
                "decision": "Enforce immediate speed restrictions on Section A-42. Cap speed at 40 km/h. Issue routing adjustments for trailing trains if necessary.",
                "communication": "Routing speed commands to Train 22436 engine cabin. Sending route delays updates to Passenger Comm Agent.",
                "coordination": "Alert Passenger Communication Agent that speeds are reduced, causing a 25-minute delay on the Vande Bharat line.",
                "action": "Updated active speed limits on Section A-42. Transmitted speed lock signal to train 22436. Throttle restricted, train slowing down to 40 km/h."
            },
            "EmergencyResponseAgent": {
                "thought": "Derailment risk on Section A-42 escalated. Track maintenance teams must deploy immediately to prevent failure before the next heavy freight train arrives.",
                "analysis": "Track Maintenance Team Delta is stationed at Kanpur Central (18km away) and is currently free. Estimated travel time is 18 minutes via utility railcar.",
                "decision": "Dispatch Maintenance Team Delta immediately with emergency replacement clips and mobile welding equipment.",
                "communication": "Sent mobilization order to Team Delta. Sent status updates to Track Health Agent and Operations feed.",
                "coordination": "Instruct Track Health Agent to monitor sensor telemetry in real-time as the team works on Section A-42.",
                "action": "Created dispatch log. Crew Delta en route with heavy repair gear. ETA 20:38. Status: Dispatched."
            },
            "PassengerCommunicationAgent": {
                "thought": "Train 22436 is executing an emergency slowdown to 40 km/h on Section A-42, causing schedule delays. Platforms along the route will face cascading delays.",
                "analysis": "Estimated delay for Vande Bharat 22436 is 25 minutes. Stations affected: NDLS, CNB, PNBE. Crowds might accumulate if updates aren't broadcast.",
                "decision": "Issue instant SMS alerts to booked passengers. Update digital signage screens at NDLS and Kanpur platforms. Broadcast automated voice announcements.",
                "communication": "Broadcasting: 'Attention passengers, Train 22436 is running 25 minutes late due to precautionary technical speed restrictions. We regret the inconvenience.'",
                "coordination": "Coordinated with Crowd Intelligence Agent to monitor potential crowd clusters on Platform 4 at New Delhi and Kanpur.",
                "action": "Triggered bulk SMS gateway for 780 registered passengers on Train 22436. Updated railway status board APIs to reflect delayed schedule."
            },
            "CrowdIntelligenceAgent": {
                "thought": f"Monitoring passenger crowd sensors on Platform 4 at station {station} due to Vande Bharat delay. Evaluating density vectors and bottlenecks.",
                "analysis": f"Current crowd density is {scenario_data.get('density', 3.5)} passengers/sqm on Platform {platform}. Foot traffic flow is slow. Risk of platform overcrowding is high.",
                "decision": "Activate passenger distribution protocol. Divert incoming passengers for next departures to Platforms 3 and 5. Deploy auxiliary station staff.",
                "communication": "Dispatched platform diversion alerts to station display boards. Requesting ground security assistance.",
                "coordination": "Coordinate with Passenger Communication Agent to broadcast platform change announcements immediately.",
                "action": f"Triggered visual directional arrows on digital kiosks at {station}. Open emergency exits on Platform {platform} to relieve bottleneck pressures."
            }
        }
        
        # Return matched fallback or a generic template
        return fallback_map.get(agent_name, {
            "thought": "Analyzing current railway parameters. Assumed default agent workflow.",
            "analysis": "No critical sensor spikes detected in current cycle.",
            "decision": "Maintain normal operations.",
            "communication": "Broadcasting status: ALL GREEN.",
            "coordination": "None required.",
            "action": "Logged default operational check."
        })

ai_service = AIService()
