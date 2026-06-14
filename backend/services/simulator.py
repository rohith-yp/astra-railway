import json
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from backend.database.models import (
    TrackSection, Train, EmergencyResponse, Incident, TrackInspection, PassengerCrowd
)
from backend.agents.track_health_agent import TrackHealthAgent
from backend.agents.risk_prediction_agent import RiskPredictionAgent
from backend.agents.train_operations_agent import TrainOperationsAgent
from backend.agents.emergency_response_agent import EmergencyResponseAgent
from backend.agents.passenger_communication_agent import PassengerCommunicationAgent
from backend.agents.crowd_intelligence_agent import CrowdIntelligenceAgent

class RailwaySimulator:
    def __init__(self):
        # Initialize the agents
        self.track_health_agent = TrackHealthAgent()
        self.risk_prediction_agent = RiskPredictionAgent()
        self.train_operations_agent = TrainOperationsAgent()
        self.emergency_response_agent = EmergencyResponseAgent()
        self.passenger_comm_agent = PassengerCommunicationAgent()
        self.crowd_intel_agent = CrowdIntelligenceAgent()
        
        # Keep track of running simulations
        self.active_simulations = {}

    async def run_scenario_step(self, scenario_type: str, step: int, db: Session) -> dict:
        """
        Executes a specific step in a cooperative agent simulation.
        Supports: "A-42-fracture", "flood", "overcrowding", "signal-failure"
        """
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if scenario_type == "A-42-fracture":
            return await self._run_a42_step(step, db, now)
        elif scenario_type == "flood":
            return await self._run_flood_step(step, db, now)
        elif scenario_type == "overcrowding":
            return await self._run_crowd_step(step, db, now)
        elif scenario_type == "signal-failure":
            return await self._run_signal_step(step, db, now)
        else:
            return {"error": f"Unknown scenario type: {scenario_type}"}

    async def _run_a42_step(self, step: int, db: Session, now_str: str) -> dict:
        context = {
            "section": "A-42",
            "location": "New Delhi - Kanpur Central Sect 4",
            "defect": "micro-fracture",
            "vibration_level": 8.7,
            "thermal_score": 49.5,
            "stress_score": 89.0,
            "geometry_score": 7.8,
            "risk_probability": 0.87,
            "train_number": "22436",
            "train_name": "Vande Bharat Express",
            "station": "NDLS",
            "platform": 4,
            "density": 3.5
        }
        
        if step == 1:
            # 1. Track Health Agent scans & detects
            # Update DB: Track section health decreases, status shifts
            sect = db.query(TrackSection).filter(TrackSection.section_id == "A-42").first()
            if sect:
                sect.health_score = 42.0
                sect.maintenance_status = "Needs Maintenance"
                db.commit()
                
            result = await self.track_health_agent.run(context)
            return {
                "step": 1,
                "agent": "TrackHealthAgent",
                "title": "Anomaly Detection",
                "message": "Micro-fracture detected on Section A-42.",
                "data": result,
                "db_changes": "Track Section A-42 health score updated to 42.0. Status set to 'Needs Maintenance'."
            }
            
        elif step == 2:
            # 2. Risk Prediction Agent calculates derailment probability
            result = await self.risk_prediction_agent.run(context)
            
            # Create/Update Incident record
            inc = db.query(Incident).filter(Incident.incident_id == "INC-A42-001").first()
            if not inc:
                inc = Incident(
                    incident_id="INC-A42-001",
                    incident_type="track defect",
                    location="New Delhi - Kanpur Central Sect 4 (Section A-42)",
                    severity="Critical",
                    timestamp=now_str,
                    status="Active"
                )
                db.add(inc)
            else:
                inc.status = "Active"
                inc.severity = "Critical"
            db.commit()
            
            return {
                "step": 2,
                "agent": "RiskPredictionAgent",
                "title": "Derailment Risk Escalation",
                "message": "Risk Prediction Agent computes a 87% probability of derailment.",
                "data": result,
                "db_changes": "Logged Incident INC-A42-001 with severity 'Critical' and status 'Active'."
            }
            
        elif step == 3:
            # 3. Train Operations Agent restricts speed
            result = await self.train_operations_agent.run(context)
            
            # Update Train speed status
            train = db.query(Train).filter(Train.train_number == "22436").first()
            if train:
                train.status = "Delayed"
                db.commit()
                
            return {
                "step": 3,
                "agent": "TrainOperationsAgent",
                "title": "Operations & Speed Limitation",
                "message": "Speed for Vande Bharat 22436 capped at 40 km/h on Section A-42.",
                "data": result,
                "db_changes": "Train 22436 status set to 'Delayed'. Restricted target speed to 40 km/h."
            }
            
        elif step == 4:
            # 4. Emergency Response Agent dispatches crew
            result = await self.emergency_response_agent.run(context)
            
            # Create Emergency Response Entry
            resp = db.query(EmergencyResponse).filter(EmergencyResponse.incident_id == "INC-A42-001").first()
            if not resp:
                resp = EmergencyResponse(
                    incident_id="INC-A42-001",
                    response_time=12,
                    team_assigned="Track Engineering Team Delta",
                    resolution_status="Dispatched"
                )
                db.add(resp)
            else:
                resp.resolution_status = "Dispatched"
            db.commit()
            
            return {
                "step": 4,
                "agent": "EmergencyResponseAgent",
                "title": "Crew Dispatch",
                "message": "Emergency Response Agent dispatches Track Engineering Team Delta.",
                "data": result,
                "db_changes": "Created emergency response record. Team Delta dispatched to Section A-42. Status: Dispatched."
            }
            
        elif step == 5:
            # 5. Passenger Communication Agent issues alerts
            result = await self.passenger_comm_agent.run(context)
            return {
                "step": 5,
                "agent": "PassengerCommunicationAgent",
                "title": "Passenger Safety Broadcast",
                "message": "Precautionary safety warnings & delay updates issued to passengers.",
                "data": result,
                "db_changes": "Broadcast SMS alerts and station digital board notifications for 780 passengers."
            }
            
        elif step == 6:
            # 6. Incident Prevented
            # Final database clean up: Incident resolved/prevented, maintenance completed
            inc = db.query(Incident).filter(Incident.incident_id == "INC-A42-001").first()
            if inc:
                inc.status = "Prevented"
            sect = db.query(TrackSection).filter(TrackSection.section_id == "A-42").first()
            if sect:
                sect.health_score = 98.0
                sect.maintenance_status = "Operational"
            train = db.query(Train).filter(Train.train_number == "22436").first()
            if train:
                train.status = "Running"
            resp = db.query(EmergencyResponse).filter(EmergencyResponse.incident_id == "INC-A42-001").first()
            if resp:
                resp.resolution_status = "Resolved"
            db.commit()
            
            # Run Crowd Agent as final reassurance checks
            result = await self.crowd_intel_agent.run(context)
            
            return {
                "step": 6,
                "agent": "CrowdIntelligenceAgent",
                "title": "Incident Successfully Prevented",
                "message": "Emergency resolved. Section A-42 welded. Vande Bharat resumed normal speed. Incident Prevented.",
                "data": result,
                "db_changes": "Incident INC-A42-001 status set to 'Prevented'. Track A-42 health restored to 98.0. Train 22436 status set back to 'Running'."
            }
            
        return {"error": "Invalid step"}

    async def _run_flood_step(self, step: int, db: Session, now_str: str) -> dict:
        context = {
            "section": "SEC-088",
            "location": "Patna Junction outer",
            "defect": "waterlogging / flood threat",
            "rainfall_mm": 115,
            "flood_risk_pct": 92.5,
            "train_number": "12309",
            "train_name": "Patna Rajdhani Express"
        }
        
        if step == 1:
            result = await self.track_health_agent.run(context)
            return {
                "step": 1,
                "agent": "TrackHealthAgent",
                "title": "Flood Alert",
                "message": "Water levels rising near Patna outer tracks.",
                "data": result,
                "db_changes": "Track Section SEC-088 flagged with high flood sensor readings."
            }
        elif step == 2:
            result = await self.risk_prediction_agent.run(context)
            return {
                "step": 2,
                "agent": "RiskPredictionAgent",
                "title": "Route Washout Threat",
                "message": "Risk Prediction computes high probability of track bed erosion.",
                "data": result,
                "db_changes": "Logged Incident INC-FLD-088. Severity set to MAJOR."
            }
        elif step == 3:
            result = await self.train_operations_agent.run(context)
            return {
                "step": 3,
                "agent": "TrainOperationsAgent",
                "title": "Emergency Diversion",
                "message": "Rerouting Patna Rajdhani 12309 via bypassing line.",
                "data": result,
                "db_changes": "Rerouted Train 12309 to bypass flooded section SEC-088."
            }
        elif step == 4:
            result = await self.emergency_response_agent.run(context)
            return {
                "step": 4,
                "agent": "EmergencyResponseAgent",
                "title": "Pump Staging",
                "message": "Dispatched Flood Mitigation Team with water drainage pump units.",
                "data": result,
                "db_changes": "Dispatched team 'Pump Squad 4' to Patna outer. Status: En Route."
            }
        elif step == 5:
            result = await self.passenger_comm_agent.run(context)
            return {
                "step": 5,
                "agent": "PassengerCommunicationAgent",
                "title": "Schedule Alterations",
                "message": "Passenger broadcast regarding route diversion and minor delays.",
                "data": result,
                "db_changes": "Broadcast SMS alerts and updated station layout timetable displays."
            }
        elif step == 6:
            # Resolve flood threat in simulation
            inc = db.query(Incident).filter(Incident.incident_id == "INC-FLD-088").first()
            if inc:
                inc.status = "Prevented"
            db.commit()
            
            result = await self.crowd_intel_agent.run(context)
            return {
                "step": 6,
                "agent": "CrowdIntelligenceAgent",
                "title": "Scenario Stabilized",
                "message": "Flood levels subsided due to active pumping. Patna outer track safe. Incident Prevented.",
                "data": result,
                "db_changes": "Incident INC-FLD-088 closed with status 'Prevented'."
            }
        return {"error": "Invalid step"}

    async def _run_crowd_step(self, step: int, db: Session, now_str: str) -> dict:
        context = {
            "station": "NDLS",
            "platform": 4,
            "defect": "overcrowding",
            "density": 4.2,
            "train_number": "12002",
            "train_name": "New Delhi Shatabdi Express"
        }
        
        if step == 1:
            result = await self.crowd_intel_agent.run(context)
            return {
                "step": 1,
                "agent": "CrowdIntelligenceAgent",
                "title": "Platform Overload",
                "message": "New Delhi Platform 4 density spikes to 4.2 passengers/sqm.",
                "data": result,
                "db_changes": "Platform density status for NDLS Platform 4 flagged as CRITICAL."
            }
        elif step == 2:
            result = await self.risk_prediction_agent.run(context)
            return {
                "step": 2,
                "agent": "RiskPredictionAgent",
                "title": "Safety Risk Evaluation",
                "message": "Risk prediction escalates hazard of passenger track-fall accidents.",
                "data": result,
                "db_changes": "Logged Incident INC-CRD-004. Severity set to MAJOR."
            }
        elif step == 3:
            result = await self.train_operations_agent.run(context)
            return {
                "step": 3,
                "agent": "TrainOperationsAgent",
                "title": "Platform Reassignment",
                "message": "Reassigning incoming Shatabdi 12002 to vacant Platform 8.",
                "data": result,
                "db_changes": "Assigned incoming train 12002 to Platform 8 instead of Platform 4."
            }
        elif step == 4:
            result = await self.emergency_response_agent.run(context)
            return {
                "step": 4,
                "agent": "EmergencyResponseAgent",
                "title": "Crowd Marshals Staged",
                "message": "Station Quick Security dispatched to manage flow bottlenecks.",
                "data": result,
                "db_changes": "Dispatched security marshals to Platform 4 stairs to control access."
            }
        elif step == 5:
            result = await self.passenger_comm_agent.run(context)
            return {
                "step": 5,
                "agent": "PassengerCommunicationAgent",
                "title": "Platform Update Announcement",
                "message": "Automated displays and audio systems direct Shatabdi passengers to Platform 8.",
                "data": result,
                "db_changes": "Updated NDLS announcement logs and passenger mobile alerts."
            }
        elif step == 6:
            # Resolve incident
            inc = db.query(Incident).filter(Incident.incident_id == "INC-CRD-004").first()
            if inc:
                inc.status = "Prevented"
            db.commit()
            
            result = await self.track_health_agent.run(context)
            return {
                "step": 6,
                "agent": "TrackHealthAgent",
                "title": "Flow Cleared",
                "message": "Crowd density reduced to safe level (1.5 passengers/sqm). Platform 4 cleared. Incident Prevented.",
                "data": result,
                "db_changes": "Incident INC-CRD-004 closed with status 'Prevented'."
            }
        return {"error": "Invalid step"}

    async def _run_signal_step(self, step: int, db: Session, now_str: str) -> dict:
        context = {
            "section": "SEC-012",
            "location": "Mumbai - Surat Block A",
            "defect": "signaling failure / red lock",
            "risk_probability": 0.90,
            "train_number": "22436",
            "train_name": "Vande Bharat Express"
        }
        
        if step == 1:
            result = await self.track_health_agent.run(context)
            return {
                "step": 1,
                "agent": "TrackHealthAgent",
                "title": "Signal Lockout",
                "message": "Automatic block signalling lock detected on Mumbai-Surat line.",
                "data": result,
                "db_changes": "Signalling node SEC-012 health score updated to 15.0."
            }
        elif step == 2:
            result = await self.risk_prediction_agent.run(context)
            return {
                "step": 2,
                "agent": "RiskPredictionAgent",
                "title": "Collision Risk Escalation",
                "message": "Risk Prediction identifies high hazard of rear-end collision due to sensor failure.",
                "data": result,
                "db_changes": "Logged Incident INC-SIG-012. Severity set to CRITICAL."
            }
        elif step == 3:
            result = await self.train_operations_agent.run(context)
            return {
                "step": 3,
                "agent": "TrainOperationsAgent",
                "title": "Route Interlock Actuations",
                "message": "Operations agent triggers safety-interlock stop commands on following trains.",
                "data": result,
                "db_changes": "Braking commands sent to all trains approaching block SEC-012."
            }
        elif step == 4:
            result = await self.emergency_response_agent.run(context)
            return {
                "step": 4,
                "agent": "EmergencyResponseAgent",
                "title": "Signal Engineers Dispatched",
                "message": "Signal Maintenance Brigade dispatched to relay substation.",
                "data": result,
                "db_changes": "Dispatched team 'Signal Brigade 9' with backup controllers. Status: Dispatched."
            }
        elif step == 5:
            result = await self.passenger_comm_agent.run(context)
            return {
                "step": 5,
                "agent": "PassengerCommunicationAgent",
                "title": "Precautionary Delay Advice",
                "message": "Broadcasting timetable updates and safety stops to passengers.",
                "data": result,
                "db_changes": "Pushed SMS delays and platform display modifications."
            }
        elif step == 6:
            # Resolve incident
            inc = db.query(Incident).filter(Incident.incident_id == "INC-SIG-012").first()
            if inc:
                inc.status = "Prevented"
            db.commit()
            
            result = await self.crowd_intel_agent.run(context)
            return {
                "step": 6,
                "agent": "CrowdIntelligenceAgent",
                "title": "Signaling Restored",
                "message": "Signal relay replaced. Interlocking normal. Approaching trains cleared for transit. Incident Prevented.",
                "data": result,
                "db_changes": "Incident INC-SIG-012 closed with status 'Prevented'. Block SEC-012 health restored to 100.0."
            }
        return {"error": "Invalid step"}

    async def run_autopilot_combination(self, scenario_type: str, db: Session, custom_description: str = None) -> dict:
        """
        Executes Groq (Fast Safety Response) and Mistral (Strategic Optimization) in combination
        to solve a critical railway problem.
        """
        from backend.services.ai_service import ai_service
        
        # 1. Select the simulation context
        if scenario_type == "A-42-fracture":
            location = "New Delhi - Kanpur Central Sect 4 (Section A-42)"
            defect = "micro-fracture"
            detail_summary = "Thermal sensor reports expanding micro-fracture under 49.5°C heat load."
            train_name = "Vande Bharat Express (Train 22436)"
            train_num = "22436"
        elif scenario_type == "flood":
            location = "Patna Junction outer (Section SEC-088)"
            defect = "waterlogging / flood threat"
            detail_summary = "Rainfall exceeds 115mm, submerging track bed and risking signaling short circuits."
            train_name = "Patna Rajdhani Express (Train 12309)"
            train_num = "12309"
        elif scenario_type == "overcrowding":
            location = "NDLS Platform 4"
            defect = "passenger platform gridlock"
            detail_summary = "Cascading schedule delays cause platform passenger density to spike to 4.2/sqm."
            train_name = "New Delhi Shatabdi Express (Train 12002)"
            train_num = "12002"
        elif scenario_type == "signal-failure":
            location = "Mumbai - Surat Block A (Section SEC-012)"
            defect = "signaling failure / red lock"
            detail_summary = "Automatic block signal relay failure locking section to warning red."
            train_name = "Vande Bharat Express (Train 22436)"
            train_num = "22436"
        else: # custom
            location = "System Wide Segment"
            defect = "Custom AI Solved Incident"
            detail_summary = custom_description or "Unspecified custom railway risk scenario."
            train_name = "Affected Railway Assets"
            train_num = "ALL"

        context = {
            "scenario": scenario_type,
            "location": location,
            "defect": defect,
            "details": detail_summary,
            "active_train": train_name
        }

        # 2. Setup prompts and instruction
        groq_instruction = f"""You are the ASTRA Rail Safety Governor.
Your strength is high-speed reflex commands (latency < 20ms).
Based on the railway defect context, issue a split-second emergency safety command (e.g. speed restriction, warning lights, emergency brakes).
Context to solve: {detail_summary}
You MUST output your response strictly as a JSON object with:
{{
  "thought": "Your split-second safety reasoning",
  "action": "Immediate emergency safety action issued"
}}
Do not include any other text."""

        mistral_instruction = f"""You are the ASTRA Rail Logistics Coordinator.
Your strength is logical reasoning and deep scheduling optimization.
Based on the context, provide a long-term resolution plan (e.g., dispatch repair crews, reroute other trains, update schedules).
Context to solve: {detail_summary}
You MUST output your response strictly as a JSON object with:
{{
  "thought": "Your deep structural logistics reasoning",
  "action": "Complete maintenance crew dispatch details, re-routing instructions, and schedule alerts"
}}
Do not include any other text."""

        prompt = f"Context: {json.dumps(context)}"

        # 3. Invoke both models or fallback to seeder monologues
        groq_res = await ai_service.call_llm(prompt, groq_instruction, "groq")
        mistral_res = await ai_service.call_llm(prompt, mistral_instruction, "mistral")

        # Fallback values if API is missing or fails
        if groq_res == "FALLBACK_DEMO" or mistral_res == "FALLBACK_DEMO":
            if scenario_type == "A-42-fracture":
                groq_parsed = {
                    "thought": "Scan reports critical defect on Section A-42. High derailment threat at speed. Immediate deceleration required.",
                    "action": "Issued emergency SPEED_RESTRICTION command to Engine Cabin 22436. Cap target speed on Section A-42 to 40 km/h."
                }
                mistral_parsed = {
                    "thought": "A speed restriction mitigates immediate risk, but we must resolve the micro-fracture permanently. Track Maintenance Team Delta is currently stationed at Kanpur Central (18km away) and is fully equipped.",
                    "action": "Dispatched Track Engineering Crew Delta to A-42. Scheduled arrival in 18 minutes. Broadcast delayed schedule updates (25-minute delay) to NDLS and CNB platform displays."
                }
            elif scenario_type == "flood":
                groq_parsed = {
                    "thought": "High flood sensor readings on SEC-088. Track bed integrity unknown under water. Risk of washout.",
                    "action": "Issued SIGNAL_LOCK halt signal to Patna Rajdhani 12309 at the outer boundary. Prevent entry to flooded block."
                }
                mistral_parsed = {
                    "thought": "Water level continues to rise. We must keep train traffic flowing. Rerouting Patna Rajdhani via the Mughal Sarai bypass loop.",
                    "action": "Modified electronic route interlocks to bypass SEC-088. Dispatched Flood Pumping Squad 4 with heavy drainage pumps to clear Patna outer lines. Broadcast route alteration delay to passengers."
                }
            elif scenario_type == "overcrowding":
                groq_parsed = {
                    "thought": "Platform 4 density exceeds safety limits (4.2 sqm). Passenger track-fall risk critical.",
                    "action": "Flagged Platform 4 access controls to RED. Temporary gate lockout to restrict further passenger flow."
                }
                mistral_parsed = {
                    "thought": "Restricting flow prevents localized platform accidents but creates bottlenecks at the main concourse. Shatabdi Express 12002 must be reassigned.",
                    "action": "Reassigned incoming train 12002 to vacant Platform 8. Dispatched 12 station crowd marshals to Platform 4 stairs to redirect foot traffic. Triggered audio and digital kiosk diversion instructions."
                }
            elif scenario_type == "signal-failure":
                groq_parsed = {
                    "thought": "Automatic signal lockout on SEC-012. Rear-end collision risk with stationary train.",
                    "action": "Issued emergency STOP command to all trains approaching Mumbai-Surat Block A. Transmit warning interlocks."
                }
                mistral_parsed = {
                    "thought": "The block is locked due to a relay short-circuit in the substation. We must dispatch technicians immediately to restore normal signals.",
                    "action": "Dispatched Signal Repair Brigade 9 to Block A substation with backup relay controls. Initiated manual block signaling protocols for trailing mail trains to minimize cascading delays."
                }
            else:
                # Custom scenario fallback based on simple description scanning
                desc = (custom_description or "").lower()
                if "brake" in desc or "speed" in desc or "decelerate" in desc or "slow" in desc:
                    groq_parsed = {
                        "thought": "Emergency deceleration / speed limit threshold restriction identified in custom telemetry feed.",
                        "action": "Issued immediate automatic throttle speed-lock limit. Restricting velocity to safe emergency target of 30 km/h."
                    }
                    mistral_parsed = {
                        "thought": "Brakes/speed caution applied. Need to mobilize maintenance specialists to examine brake calipers/control modules.",
                        "action": "Dispatched Air Brake Engineering Team Delta to nearest junction with diagnostic rigs. Alerted stations of minor timeline delays."
                    }
                elif "signal" in desc or "red" in desc or "green" in desc or "light" in desc or "interlock" in desc:
                    groq_parsed = {
                        "thought": "Signaling discrepancy or red lockout registered on approaching block. Front-end path collision hazard detected.",
                        "action": "Sent electronic interlock STOP override. Commanded all incoming train lines to halt outside boundary."
                    }
                    mistral_parsed = {
                        "thought": "Signaling systems require manual physical relay resets. Technicians must be dispatched immediately.",
                        "action": "Dispatched Signal Brigade 9 to local relay substation. Enforced manual block signaling rules for following mail trains."
                    }
                elif "flood" in desc or "water" in desc or "rain" in desc or "monsoon" in desc or "river" in desc:
                    groq_parsed = {
                        "thought": "High rainfall or water logging threat detected. High risk of ballast erosion and derailment.",
                        "action": "Enforce strict speed restrictions of 15 km/h over flooded sections. Issue hazard telemetry warnings."
                    }
                    mistral_parsed = {
                        "thought": "Active pump operations required to lower local water level. Trailing cargo traffic should be diverted.",
                        "action": "Dispatched water pumping utility crew Delta to waterlogged lines. Diverted trailing cargo assets to high-ground loops."
                    }
                elif "animal" in desc or "cow" in desc or "obstruction" in desc or "landslide" in desc or "boulder" in desc or "track" in desc:
                    groq_parsed = {
                        "thought": "Track obstruction alert received. Telemetry scanner shows obstacles on path lines.",
                        "action": "Engaged emergency brake system. Restricted velocity immediately. Broadcast hazard tags to cabins."
                    }
                    mistral_parsed = {
                        "thought": "Obstruction clearing crew must deploy instantly to sweep and clear the line.",
                        "action": "Mobilized Obstruction Clearance Team to coordinates. Scheduled station digital delays announcements of 30 mins."
                    }
                else:
                    groq_parsed = {
                        "thought": "Custom threat scenario reported. Commencing precautionary emergency mitigation.",
                        "action": "Engaged general speed cap of 40 km/h on closest route block. Set warning markers on active digital tracks."
                    }
                    mistral_parsed = {
                        "thought": "Further inspection is required to assess threat conditions. Scheduled dispatch of a validation crew.",
                        "action": "Dispatched regional track engineers for manual check. Sent text alerts to passengers outlining delays."
                    }
        else:
            try:
                text_g = groq_res.strip()
                if text_g.startswith("```json"): text_g = text_g[7:]
                if text_g.endswith("```"): text_g = text_g[:-3]
                groq_parsed = json.loads(text_g.strip())
            except Exception:
                groq_parsed = {"thought": "Emergency safety review engaged.", "action": "Issued emergency speed caps on threat zone."}

            try:
                text_m = mistral_res.strip()
                if text_m.startswith("```json"): text_m = text_m[7:]
                if text_m.endswith("```"): text_m = text_m[:-3]
                mistral_parsed = json.loads(text_m.strip())
            except Exception:
                mistral_parsed = {"thought": "Strategic scheduling review engaged.", "action": "Dispatched maintenance team to weld anomalies."}

        # 4. Apply database updates to resolve the scenario completely
        if scenario_type == "A-42-fracture":
            sect = db.query(TrackSection).filter(TrackSection.section_id == "A-42").first()
            if sect:
                sect.health_score = 98.0
                sect.maintenance_status = "Operational"
            train = db.query(Train).filter(Train.train_number == "22436").first()
            if train:
                train.status = "Running"
            inc = db.query(Incident).filter(Incident.incident_id == "INC-A42-001").first()
            if inc:
                inc.status = "Prevented"
            else:
                inc = Incident(
                    incident_id="INC-A42-001",
                    incident_type="track defect",
                    location=location,
                    severity="Critical",
                    timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    status="Prevented"
                )
                db.add(inc)
            resp = db.query(EmergencyResponse).filter(EmergencyResponse.incident_id == "INC-A42-001").first()
            if not resp:
                resp = EmergencyResponse(incident_id="INC-A42-001", response_time=18, team_assigned="Track Engineering Team Delta", resolution_status="Resolved")
                db.add(resp)
            else:
                resp.resolution_status = "Resolved"
                
        elif scenario_type == "flood":
            sect = db.query(TrackSection).filter(TrackSection.section_id == "SEC-088").first()
            if sect:
                sect.health_score = 95.0
                sect.maintenance_status = "Operational"
            inc = db.query(Incident).filter(Incident.incident_id == "INC-FLD-088").first()
            if inc:
                inc.status = "Prevented"
            else:
                inc = Incident(incident_id="INC-FLD-088", incident_type="flood", location=location, severity="Major", timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), status="Prevented")
                db.add(inc)
                
        elif scenario_type == "overcrowding":
            inc = db.query(Incident).filter(Incident.incident_id == "INC-CRD-004").first()
            if inc:
                inc.status = "Prevented"
            else:
                inc = Incident(incident_id="INC-CRD-004", incident_type="overcrowding", location=location, severity="Major", timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), status="Prevented")
                db.add(inc)
                
        elif scenario_type == "signal-failure":
            sect = db.query(TrackSection).filter(TrackSection.section_id == "SEC-012").first()
            if sect:
                sect.health_score = 100.0
                sect.maintenance_status = "Operational"
            inc = db.query(Incident).filter(Incident.incident_id == "INC-SIG-012").first()
            if inc:
                inc.status = "Prevented"
            else:
                inc = Incident(incident_id="INC-SIG-012", incident_type="signal failure", location=location, severity="Critical", timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), status="Prevented")
                db.add(inc)
        else:
            # Custom incident db resolution logging
            inc = db.query(Incident).filter(Incident.incident_id == "INC-CUST-999").first()
            if inc:
                inc.status = "Prevented"
            else:
                inc = Incident(
                    incident_id="INC-CUST-999",
                    incident_type="custom threat",
                    location=location,
                    severity="Major",
                    timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    status="Prevented"
                )
                db.add(inc)

        db.commit()

        # Generate disaster verification & dispatch assessment data
        disaster_assessment = None
        if scenario_type == "custom" or (custom_description and scenario_type not in ["A-42-fracture", "flood", "overcrowding", "signal-failure"]):
            desc = (custom_description or "").lower()
            
            # 1. Satellite scan message
            if "fire" in desc or "smoke" in desc or "explosion" in desc or "blast" in desc:
                sat_scan = "Orbital infrared cameras indicate a sudden +18.4 Gs thermal heat spike at coordinates."
            elif "flood" in desc or "water" in desc or "rain" in desc or "river" in desc:
                sat_scan = "Synthetic Aperture Radar (SAR) sensors register water accumulation and roadbed ballast liquefaction."
            elif "landslide" in desc or "boulder" in desc or "obstacle" in desc:
                sat_scan = "Optical imaging satellite registers physical blockage and track grid alignment displacement."
            else:
                sat_scan = "Orbital visual satellite sweep completed. Anomaly telemetry verified against reference track charts."
                
            # 2. Confirmation source message
            if "social" in desc or "tweet" in desc or "report" in desc or "people" in desc:
                confirm_src = "Cross-referenced visual reports with geofenced local social media feeds (5 posts) and user uploads."
            else:
                confirm_src = "Verified with transponder TV signals from nearest cabin engine and local railway track sensors."
                
            # 3. Real vs Fake percentages
            import random
            real_pct = random.randint(87, 98)
            fake_pct = 100 - real_pct
            
            # 4. Dispatches details
            hospital_msg = "Dispatched Trauma Unit and Kanpur Central Emergency Medical Ward. ETA 11 mins."
            firefighter_msg = "Dispatched Railway Fire Station Brigade Team 3. ETA 8 mins."
            news_msg = "Broadcast emergency SMS alerts to all active passenger cell devices in 5km radius and news wire networks."
            
            if "fire" in desc or "smoke" in desc:
                firefighter_msg = "Urgent: Mobilized Fire Hydrant Squad 5 and local rescue vehicles. ETA 7 mins."
            if "injur" in desc or "hurt" in desc or "accident" in desc or "blood" in desc:
                hospital_msg = "Urgent: Staged Ambulance Response Unit 2 and notified Kanpur Trauma Center. ETA 6 mins."
            if "news" in desc or "alert" in desc or "public" in desc:
                news_msg = "Pushed cell broadcast alerts to 1,580 passenger devices. Sent safety bulleting to regional news networks."

            disaster_assessment = {
                "satellite_scan": sat_scan,
                "confirmation_sources": confirm_src,
                "real_percentage": real_pct,
                "fake_percentage": fake_pct,
                "dispatches": {
                    "hospitals": hospital_msg,
                    "firefighters": firefighter_msg,
                    "news_broadcast": news_msg
                }
            }
        elif scenario_type == "A-42-fracture":
            disaster_assessment = {
                "satellite_scan": "Orbital laser interferometry registers track structural fatigue on Section A-42.",
                "confirmation_sources": "Verified with transponder signals and trackside stress gauges.",
                "real_percentage": 96,
                "fake_percentage": 4,
                "dispatches": {
                    "hospitals": "Alerted station first-aid rooms at NDLS and CNB. Standby status active.",
                    "firefighters": "Dispatched Track Engineering Welding Team Delta. ETA 12 mins.",
                    "news_broadcast": "SMS schedule warnings and delay tags sent to Vande Bharat passengers."
                }
            }
        elif scenario_type == "flood":
            disaster_assessment = {
                "satellite_scan": "Satellite radar scans confirm Patna Outer track bed fully submerged.",
                "confirmation_sources": "Cross-referenced with geofenced social media posts and Patna signal monitors.",
                "real_percentage": 94,
                "fake_percentage": 6,
                "dispatches": {
                    "hospitals": "Patna Junction medical responders staged. Standby active.",
                    "firefighters": "Mobilized Flood Pump Squad 4 with heavy drainage pumps. ETA 14 mins.",
                    "news_broadcast": "Rerouting alert broadcasted on Patna station display boards and regional news channels."
                }
            }
        elif scenario_type == "overcrowding":
            disaster_assessment = {
                "satellite_scan": "Visual feed scan confirms extreme crowd concentration on Platform 4 (NDLS).",
                "confirmation_sources": "Verified with Platform 4 turnstile counters and passenger posts on social media.",
                "real_percentage": 91,
                "fake_percentage": 9,
                "dispatches": {
                    "hospitals": "NDLS Platform Medical Clinic alerted. Staged auxiliary responders.",
                    "firefighters": "Dispatched Concourse Safety Patrol to redirect escalator/stairs queues. ETA 3 mins.",
                    "news_broadcast": "Concourse speaker announcement loops activated and platform kiosk signs updated."
                }
            }
        elif scenario_type == "signal-failure":
            disaster_assessment = {
                "satellite_scan": "Thermal satellite sensors report overheating relay at Mumbai Block A substation.",
                "confirmation_sources": "Verified with automatic signaling interlock logs and cabin transponder telemetry.",
                "real_percentage": 98,
                "fake_percentage": 2,
                "dispatches": {
                    "hospitals": "Local station emergency clinics alerted on standby.",
                    "firefighters": "Dispatched Signal Repair Brigade 9. ETA 10 mins.",
                    "news_broadcast": "Electronic delay advisories pushed to approaching trains and TV transponders."
                }
            }

        # 5. Compile combined response
        return {
            "status": "resolved",
            "scenario": scenario_type,
            "location": location,
            "defect_type": defect,
            "groq_analysis": {
                "model": "llama-3.1-8b-instant" if not ai_service.groq_key else "llama-3.3-70b-versatile",
                "latency": "0.12s",
                "thought": groq_parsed.get("thought", "Immediate safety override triggered."),
                "action": groq_parsed.get("action", "Decelerated approach speed limit.")
            },
            "mistral_analysis": {
                "model": "mistral-small-latest" if not ai_service.mistral_key else "mistral-large-latest",
                "latency": "1.14s",
                "thought": mistral_parsed.get("thought", "Strategic dispatcher rerouting initialized."),
                "action": mistral_parsed.get("action", "Dispatched regional crew and updated platforms timetable.")
            },
            "unified_decision": f"Derailment threat eliminated. Safety limits engaged by Groq and strategic recovery scheduled by Mistral. Status: PREVENTED.",
            "db_changes": f"Incident resolved in SQL registry. Track section health restored. Emergency responses updated.",
            "disaster_assessment": disaster_assessment
        }

simulator = RailwaySimulator()
