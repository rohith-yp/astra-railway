from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from .connection import Base

class Train(Base):
    __tablename__ = "trains"
    
    train_number = Column(String(50), primary_key=True)
    train_name = Column(String(100), nullable=False)
    source_station = Column(String(100), nullable=False)
    destination_station = Column(String(100), nullable=False)
    train_type = Column(String(50), nullable=False)  # Rajdhani, Shatabdi, Vande Bharat, etc.
    capacity = Column(Integer, nullable=False)
    average_speed = Column(Float, nullable=False)
    route_distance = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)      # Running, Delayed, Scheduled, Suspended

class Station(Base):
    __tablename__ = "stations"
    
    station_code = Column(String(50), primary_key=True)
    station_name = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    platforms = Column(Integer, nullable=False)
    daily_passengers = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

class TrackSection(Base):
    __tablename__ = "track_sections"
    
    section_id = Column(String(50), primary_key=True)
    location = Column(String(150), nullable=False)
    track_length = Column(Float, nullable=False)  # in km
    health_score = Column(Float, nullable=False)  # 0 to 100
    inspection_date = Column(String(50), nullable=False)
    maintenance_status = Column(String(50), nullable=False)  # Operational, Needs Maintenance, Under Repair

class TrackInspection(Base):
    __tablename__ = "track_inspections"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    track_section = Column(String(50), nullable=False)
    vibration_score = Column(Float, nullable=False)
    thermal_score = Column(Float, nullable=False)
    stress_score = Column(Float, nullable=False)
    geometry_score = Column(Float, nullable=False)
    inspection_time = Column(String(50), nullable=False)
    risk_level = Column(String(50), nullable=False)  # Low, Medium, High, Critical

class Incident(Base):
    __tablename__ = "incidents"
    
    incident_id = Column(String(50), primary_key=True)
    incident_type = Column(String(100), nullable=False)  # derailment, track defect, signal failure, overcrowding, etc.
    location = Column(String(150), nullable=False)
    severity = Column(String(50), nullable=False)       # Minor, Moderate, Major, Critical
    timestamp = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)         # Active, Under Response, Resolved, Prevented

class PassengerCrowd(Base):
    __tablename__ = "passenger_crowds"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    station = Column(String(50), nullable=False)
    platform = Column(Integer, nullable=False)
    crowd_density = Column(Integer, nullable=False)  # passengers/sqm or total headcount
    timestamp = Column(String(50), nullable=False)

class WeatherImpact(Base):
    __tablename__ = "weather_impacts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    location = Column(String(150), nullable=False)
    rainfall = Column(Float, nullable=False)     # in mm
    temperature = Column(Float, nullable=False)  # in Celsius
    flood_risk = Column(Float, nullable=False)   # 0 to 100
    visibility = Column(Float, nullable=False)   # in meters
    wind_speed = Column(Float, nullable=False)   # in km/h

class EmergencyResponse(Base):
    __tablename__ = "emergency_responses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), nullable=False)
    response_time = Column(Integer, nullable=False)      # in minutes
    team_assigned = Column(String(100), nullable=False)  # Maintenance Alpha, Medical Team 3, etc.
    resolution_status = Column(String(50), nullable=False)  # Dispatched, En Route, On Scene, Resolved

class Simulation(Base):
    __tablename__ = "simulations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    scenario_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    trigger_type = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)  # Pending, Simulated, Active
    details = Column(Text, nullable=True)         # JSON string for scenario configurations
