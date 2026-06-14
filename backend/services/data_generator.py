import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, sessionmaker
from backend.database.models import (
    Train, Station, TrackSection, TrackInspection, 
    Incident, PassengerCrowd, WeatherImpact, EmergencyResponse, Simulation
)
from backend.database.connection import Base, engine

# Predefined Major Indian Stations (for anchor points on our map)
MAJOR_STATIONS = [
    {"code": "NDLS", "name": "New Delhi", "city": "Delhi", "state": "Delhi", "lat": 28.642, "lon": 77.219, "platforms": 16},
    {"code": "CSMT", "name": "Chhatrapati Shivaji Maharaj Terminus", "city": "Mumbai", "state": "Maharashtra", "lat": 18.940, "lon": 72.835, "platforms": 18},
    {"code": "HWH", "name": "Howrah Junction", "city": "Kolkata", "state": "West Bengal", "lat": 22.583, "lon": 88.341, "platforms": 23},
    {"code": "MAS", "name": "Chennai Central", "city": "Chennai", "state": "Tamil Nadu", "lat": 13.082, "lon": 80.270, "platforms": 12},
    {"code": "SBC", "name": "KSR Bengaluru City Junction", "city": "Bengaluru", "state": "Karnataka", "lat": 12.978, "lon": 77.572, "platforms": 10},
    {"code": "SC", "name": "Secunderabad Junction", "city": "Hyderabad", "state": "Telangana", "lat": 17.433, "lon": 78.501, "platforms": 10},
    {"code": "PNBE", "name": "Patna Junction", "city": "Patna", "state": "Bihar", "lat": 25.602, "lon": 85.137, "platforms": 10},
    {"code": "ADI", "name": "Ahmedabad Junction", "city": "Ahmedabad", "state": "Gujarat", "lat": 23.026, "lon": 72.601, "platforms": 12},
    {"code": "PUNE", "name": "Pune Junction", "city": "Pune", "state": "Maharashtra", "lat": 18.528, "lon": 73.874, "platforms": 6},
    {"code": "CNB", "name": "Kanpur Central", "city": "Kanpur", "state": "Uttar Pradesh", "lat": 26.471, "lon": 80.348, "platforms": 10},
    {"code": "LKO", "name": "Lucknow Charbagh", "city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.831, "lon": 80.915, "platforms": 9},
    {"code": "NGP", "name": "Nagpur Junction", "city": "Nagpur", "state": "Maharashtra", "lat": 21.152, "lon": 79.088, "platforms": 8},
    {"code": "GHY", "name": "Guwahati Junction", "city": "Guwahati", "state": "Assam", "lat": 26.180, "lon": 91.753, "platforms": 7},
    {"code": "BBS", "name": "Bhubaneswar", "city": "Bhubaneswar", "state": "Odisha", "lat": 20.264, "lon": 85.843, "platforms": 6},
    {"code": "BPL", "name": "Bhopal Junction", "city": "Bhopal", "state": "Madhya Pradesh", "lat": 23.258, "lon": 77.411, "platforms": 6},
    {"code": "JAT", "name": "Jammu Tawi", "city": "Jammu", "state": "Jammu & Kashmir", "lat": 32.706, "lon": 74.879, "platforms": 5},
    {"code": "MDU", "name": "Madurai Junction", "city": "Madurai", "state": "Tamil Nadu", "lat": 9.917, "lon": 78.119, "platforms": 8},
    {"code": "JBP", "name": "Jabalpur Junction", "city": "Jabalpur", "state": "Madhya Pradesh", "lat": 23.167, "lon": 79.940, "platforms": 6},
    {"code": "VSKP", "name": "Visakhapatnam Junction", "city": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.721, "lon": 83.298, "platforms": 8},
    {"code": "GKP", "name": "Gorakhpur Junction", "city": "Gorakhpur", "state": "Uttar Pradesh", "lat": 26.760, "lon": 83.393, "platforms": 10}
]

CITIES = [
    "Varanasi", "Jaipur", "Surat", "Indore", "Coimbatore", "Amritsar", "Chandigarh", "Dehradun",
    "Ranchi", "Raipur", "Agra", "Allahabad", "Gwalior", "Vijayawada", "Kochi", "Trivandrum",
    "Udaipur", "Kota", "Jodhpur", "Shimla", "Dhanbad", "Jamshedpur", "Asansol", "Siliguri"
]

STATES = [
    "Uttar Pradesh", "Rajasthan", "Gujarat", "Madhya Pradesh", "Tamil Nadu", "Punjab", "Haryana",
    "Uttarakhand", "Jharkhand", "Chhattisgarh", "Andhra Pradesh", "Kerala", "West Bengal", "Himachal Pradesh"
]

TRAIN_TYPES = ["Rajdhani Express", "Shatabdi Express", "Vande Bharat", "Duronto Express", "Garib Rath", "Jan Shatabdi", "Humsafar Express", "Superfast Mail"]

STATION_SUFFIXES = [" Junction", " Central", " Cantt", " Terminal", " Road", " City"]

def generate_stations(count: int = 200) -> list[Station]:
    stations = []
    # Add major stations first
    for i, s in enumerate(MAJOR_STATIONS):
        if i >= count:
            break
        stations.append(Station(
            station_code=s["code"],
            station_name=s["name"],
            city=s["city"],
            state=s["state"],
            platforms=s["platforms"],
            daily_passengers=random.randint(50000, 300000),
            latitude=s["lat"],
            longitude=s["lon"]
        ))
    
    # Generate remaining stations randomly distributed within India boundary
    # Latitude: 8.4 to 34.0, Longitude: 68.7 to 92.0
    while len(stations) < count:
        city = random.choice(CITIES) + f" {random.randint(1, 9)}" if random.random() < 0.2 else random.choice(CITIES)
        suffix = random.choice(STATION_SUFFIXES)
        station_name = city + suffix
        code = "".join([c for c in station_name if c.isupper()])[:4]
        # Ensure unique codes
        code_suffix = 1
        original_code = code
        while any(s.station_code == code for s in stations) or len(code) < 3:
            code = f"{original_code}{code_suffix}"
            code_suffix += 1
            
        lat = round(random.uniform(8.4, 34.0), 3)
        lon = round(random.uniform(68.7, 92.0), 3)
        stations.append(Station(
            station_code=code,
            station_name=station_name,
            city=city,
            state=random.choice(STATES),
            platforms=random.randint(2, 10),
            daily_passengers=random.randint(5000, 80000),
            latitude=lat,
            longitude=lon
        ))
    return stations

def generate_trains(stations: list[Station], count: int = 500) -> list[Train]:
    trains = []
    # Seed 500 trains
    for i in range(count):
        t_num = str(12000 + i)
        t_type = random.choice(TRAIN_TYPES)
        # Select source and dest
        src = random.choice(stations)
        dest = random.choice(stations)
        while src.station_code == dest.station_code:
            dest = random.choice(stations)
            
        t_name = f"{src.city} - {dest.city} {t_type.split()[0]}"
        if t_type == "Vande Bharat":
            t_name = f"{src.city} - {dest.city} Vande Bharat Express"
            
        capacity = random.choice([400, 600, 780, 1100, 1200])
        avg_speed = round(random.uniform(55.0, 110.0), 1)
        if t_type == "Vande Bharat":
            avg_speed = round(random.uniform(90.0, 130.0), 1)
        elif t_type == "Rajdhani Express":
            avg_speed = round(random.uniform(85.0, 115.0), 1)
            
        distance = round(random.uniform(100.0, 2500.0), 1)
        status = random.choice(["Running", "Running", "Running", "Running", "Scheduled", "Delayed", "Suspended"])
        
        trains.append(Train(
            train_number=t_num,
            train_name=t_name,
            source_station=src.station_name,
            destination_station=dest.station_name,
            train_type=t_type,
            capacity=capacity,
            average_speed=avg_speed,
            route_distance=distance,
            status=status
        ))
    return trains

def generate_track_sections(stations: list[Station], count: int = 1000) -> list[TrackSection]:
    sections = []
    # Ensure Track Section A-42 exists explicitly
    sections.append(TrackSection(
        section_id="A-42",
        location="New Delhi - Kanpur Central Sect 4",
        track_length=12.5,
        health_score=92.0, # Will be set to 92 originally, then defect triggers micro-fracture
        inspection_date=(datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
        maintenance_status="Operational"
    ))
    
    # Generate remaining track sections
    for i in range(1, count):
        sect_id = f"SEC-{i:03d}"
        # Pick two stations to connect
        s1 = random.choice(stations)
        s2 = random.choice(stations)
        while s1.station_code == s2.station_code:
            s2 = random.choice(stations)
            
        location = f"{s1.city} - {s2.city} Sect {random.randint(1, 8)}"
        track_length = round(random.uniform(5.0, 60.0), 1)
        health_score = round(random.uniform(65.0, 100.0), 1)
        inspection_date = (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d")
        
        # Determine status based on health
        if health_score < 75.0:
            m_status = "Needs Maintenance"
        elif health_score < 85.0:
            m_status = "Operational" if random.random() < 0.7 else "Needs Maintenance"
        else:
            m_status = "Operational"
            
        sections.append(TrackSection(
            section_id=sect_id,
            location=location,
            track_length=track_length,
            health_score=health_score,
            inspection_date=inspection_date,
            maintenance_status=m_status
        ))
    return sections

def generate_track_inspections(sections: list[TrackSection], count: int = 5000) -> list[TrackInspection]:
    inspections = []
    now = datetime.now()
    
    # Create critical A-42 inspection
    inspections.append(TrackInspection(
        track_section="A-42",
        vibration_score=8.7,  # Elevated
        thermal_score=49.5,   # High
        stress_score=89.0,    # Very high
        geometry_score=7.8,   # Deviated
        inspection_time=now.strftime("%Y-%m-%d %H:%M:%S"),
        risk_level="High"
    ))
    
    for _ in range(1, count):
        sect = random.choice(sections)
        vibe = round(random.uniform(0.5, 9.5), 2)
        therm = round(random.uniform(15.0, 62.0), 2)
        stress = round(random.uniform(10.0, 95.0), 2)
        geom = round(random.uniform(0.5, 9.5), 2)
        
        # Calculate risk level
        score_triggers = 0
        if vibe > 7.5: score_triggers += 1
        if therm > 52.0: score_triggers += 1
        if stress > 80.0: score_triggers += 1
        if geom > 7.5: score_triggers += 1
        
        if score_triggers >= 3:
            risk = "Critical"
        elif score_triggers == 2:
            risk = "High"
        elif score_triggers == 1:
            risk = "Medium"
        else:
            risk = "Low"
            
        inspect_time = (now - timedelta(hours=random.randint(1, 720))).strftime("%Y-%m-%d %H:%M:%S")
        inspections.append(TrackInspection(
            track_section=sect.section_id,
            vibration_score=vibe,
            thermal_score=therm,
            stress_score=stress,
            geometry_score=geom,
            inspection_time=inspect_time,
            risk_level=risk
        ))
    return inspections

def generate_incidents(sections: list[TrackSection], count: int = 1000) -> list[Incident]:
    incidents = []
    types = ["derailment", "track defect", "signal failure", "route disruption", "weather impact", "overcrowding"]
    severities = ["Minor", "Moderate", "Major", "Critical"]
    statuses = ["Resolved", "Resolved", "Resolved", "Prevented", "Prevented", "Under Response", "Active"]
    now = datetime.now()
    
    # Seed micro-fracture incident for A-42
    incidents.append(Incident(
        incident_id="INC-A42-001",
        incident_type="track defect",
        location="New Delhi - Kanpur Central Sect 4 (Section A-42)",
        severity="Critical",
        timestamp=now.strftime("%Y-%m-%d %H:%M:%S"),
        status="Active"
    ))
    
    for i in range(1, count):
        inc_id = f"INC-{i:04d}"
        sect = random.choice(sections)
        inc_type = random.choice(types)
        
        severity = random.choice(severities)
        if inc_type == "derailment":
            severity = "Critical"
        elif inc_type == "track defect" and random.random() < 0.3:
            severity = "Major"
            
        status = random.choice(statuses)
        timestamp = (now - timedelta(days=random.randint(1, 60))).strftime("%Y-%m-%d %H:%M:%S")
        
        incidents.append(Incident(
            incident_id=inc_id,
            incident_type=inc_type,
            location=sect.location,
            severity=severity,
            timestamp=timestamp,
            status=status
        ))
    return incidents

def generate_passenger_crowds(stations: list[Station], count: int = 5000) -> list[PassengerCrowd]:
    crowds = []
    now = datetime.now()
    for _ in range(count):
        st = random.choice(stations)
        plat = random.randint(1, st.platforms)
        crowd_density = random.randint(10, 450) # count or density
        timestamp = (now - timedelta(hours=random.randint(1, 168))).strftime("%Y-%m-%d %H:%M:%S")
        crowds.append(PassengerCrowd(
            station=st.station_code,
            platform=plat,
            crowd_density=crowd_density,
            timestamp=timestamp
        ))
    return crowds

def generate_weather_impacts(sections: list[TrackSection], count: int = 2000) -> list[WeatherImpact]:
    weathers = []
    for _ in range(count):
        sect = random.choice(sections)
        rainfall = round(random.uniform(0.0, 120.0), 1)
        temp = round(random.uniform(5.0, 48.0), 1)
        wind = round(random.uniform(0.0, 85.0), 1)
        
        # visibility decreases with high rainfall
        visibility = round(max(200.0, 10000.0 - rainfall * 80.0 - random.uniform(0, 1000)), 1)
        
        # flood risk based on rainfall
        flood_risk = round(min(100.0, rainfall * 0.8 + random.uniform(0, 15)), 1) if rainfall > 20.0 else round(random.uniform(0.0, 10.0), 1)
        
        weathers.append(WeatherImpact(
            location=sect.location,
            rainfall=rainfall,
            temperature=temp,
            flood_risk=flood_risk,
            visibility=visibility,
            wind_speed=wind
        ))
    return weathers

def generate_emergency_responses(incidents: list[Incident], count: int = 1000) -> list[EmergencyResponse]:
    responses = []
    teams = [
        "Rapid Response Crew Alpha", "Track Engineering Team Delta", "Emergency Medical Services Unit 4",
        "Signal Repair Brigade 9", "Disaster Management Force 2", "Station Crowd Control Taskforce"
    ]
    statuses = ["Dispatched", "En Route", "On Scene", "Resolved"]
    
    # Specific response for A-42
    responses.append(EmergencyResponse(
        incident_id="INC-A42-001",
        response_time=12,
        team_assigned="Track Engineering Team Delta",
        resolution_status="Dispatched"
    ))
    
    for i in range(1, min(count, len(incidents))):
        inc = incidents[i]
        resp_time = random.randint(15, 180)
        team = random.choice(teams)
        
        # Align resolution status with incident status
        if inc.status == "Resolved" or inc.status == "Prevented":
            status = "Resolved"
        elif inc.status == "Under Response":
            status = random.choice(["En Route", "On Scene"])
        else:
            status = random.choice(statuses)
            
        responses.append(EmergencyResponse(
            incident_id=inc.incident_id,
            response_time=resp_time,
            team_assigned=team,
            resolution_status=status
        ))
    return responses

def generate_simulations(count: int = 500) -> list[Simulation]:
    simulations = []
    
    scenarios = [
        {
            "name": "Micro-fracture Detection on Track A-42",
            "desc": "A thermal sensor detects a minor structural anomaly (micro-fracture) on Section A-42. High temperature triggers quick expansion, leading to risk of derailment.",
            "trigger": "Track sensor alarm: High thermal expansion",
            "details": '{"section": "A-42", "defect": "micro-fracture", "vibration_level": 8.7, "risk_probability": 0.87}'
        },
        {
            "name": "Monsoon Flooding near Patna Junction",
            "desc": "Heavy rainfall of over 110mm creates track submergence risks. Risk of signal short-circuits and rail erosion in Patna suburban limits.",
            "trigger": "Weather warning: Severe rainfall in East Central zone",
            "details": '{"location": "Patna Junction outer", "rainfall_mm": 115, "flood_risk_pct": 92.5}'
        },
        {
            "name": "Overcrowding at New Delhi Platform 4",
            "desc": "Delay of three festival special trains results in overcrowding. Daily passenger volume exceeds platform capacity by 180%, causing passenger safety risks.",
            "trigger": "Platform CCTV crowd density alert: Level Red",
            "details": '{"station": "NDLS", "platform": 4, "crowd_density_ratio": 2.8, "waiting_passengers": 4500}'
        },
        {
            "name": "Vande Bharat Express Route Interruption (Signal Failure)",
            "desc": "Automatic signaling block fails between Mumbai Central and Surat. Train 22436 is stationary on main line with passenger cascading delays.",
            "trigger": "Signal status: Off-line / Red lock",
            "details": '{"route": "Mumbai - Surat", "train_number": "22436", "delay_min": 45, "safety_interlock": "Active"}'
        },
        {
            "name": "Summer Thermal Buckling on Central Line",
            "desc": "Temperatures reach 47°C causing extreme metal expansion on high-speed sections. Requires temporary speed restriction of all passing trains to prevent buckling derailment.",
            "trigger": "Track temperature sensor: 59.8°C",
            "details": '{"location": "Bhopal - Jabalpur Section", "ambient_temp_c": 47.2, "rail_temp_c": 59.8}'
        }
    ]
    
    # Generate 500 simulation scenarios
    for i in range(count):
        sc = scenarios[i % len(scenarios)]
        simulations.append(Simulation(
            scenario_name=f"{sc['name']} (Scenario #{i+1:03d})",
            description=sc["desc"],
            trigger_type=sc["trigger"],
            status="Pending",
            details=sc["details"]
        ))
    return simulations

def initialize_database_data(db: Session):
    # Check if database is already populated
    if db.query(Train).count() > 0:
        print("Database already populated. Skipping generation.")
        return
        
    print("Generating Stations...")
    stations = generate_stations(200)
    db.add_all(stations)
    db.commit() # Commit to resolve references and allow queries
    
    print("Generating Trains...")
    trains = generate_trains(stations, 500)
    db.add_all(trains)
    
    print("Generating Track Sections...")
    sections = generate_track_sections(stations, 1000)
    db.add_all(sections)
    db.commit()
    
    print("Generating Track Inspections...")
    inspections = generate_track_inspections(sections, 5000)
    # Bulk insert for speed
    db.bulk_save_objects(inspections)
    
    print("Generating Incidents...")
    incidents = generate_incidents(sections, 1000)
    db.bulk_save_objects(incidents)
    db.commit()
    
    print("Generating Passenger Crowd Data...")
    crowds = generate_passenger_crowds(stations, 5000)
    db.bulk_save_objects(crowds)
    
    print("Generating Weather Impacts...")
    weathers = generate_weather_impacts(sections, 2000)
    db.bulk_save_objects(weathers)
    
    # Reload incidents to link response records
    all_incidents = db.query(Incident).all()
    print("Generating Emergency Responses...")
    responses = generate_emergency_responses(all_incidents, 1000)
    db.bulk_save_objects(responses)
    
    print("Generating Simulations...")
    simulations = generate_simulations(500)
    db.bulk_save_objects(simulations)
    
    db.commit()
    print("Database seeding completed successfully.")

def run_db_initialization():
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        initialize_database_data(db)
    finally:
        db.close()

if __name__ == "__main__":
    run_db_initialization()
