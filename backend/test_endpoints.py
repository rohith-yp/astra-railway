import json
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    print("\n--- Testing Health Check Endpoint ---")
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    print("Health Status Output:", data)
    assert data["status"] == "operational"
    assert data["deployment"] == "single-vercel-project"
    assert data["database"]["status"] == "operational"
    assert data["database"]["stations"] > 0
    assert "groq_configured" in data["ai"]
    assert "mistral_configured" in data["ai"]

def test_vercel_entrypoint():
    from api.index import app as vercel_app
    assert vercel_app is app

def test_stats():
    print("\n--- Testing Dashboard Stats Endpoint ---")
    response = client.get("/api/data/stats")
    assert response.status_code == 200
    data = response.json()
    print("Stats Output Summary:", {k: data[k] for k in ["trains_running", "health_index", "active_risks"]})
    assert "trains_running" in data
    assert "health_index" in data

def test_stations():
    print("\n--- Testing Stations List Endpoint ---")
    response = client.get("/api/data/stations?limit=5")
    assert response.status_code == 200
    data = response.json()
    print(f"Retrieved {len(data)} stations. Sample station:", data[0]["station_name"])
    assert len(data) > 0

def test_trains():
    print("\n--- Testing Trains List Endpoint ---")
    response = client.get("/api/data/trains?limit=5")
    assert response.status_code == 200
    data = response.json()
    print(f"Retrieved {len(data)} trains. Sample train:", data[0]["train_name"])
    assert len(data) > 0

def test_simulation_scenarios():
    print("\n--- Testing Simulation Scenarios Endpoint ---")
    response = client.get("/api/simulation/scenarios")
    assert response.status_code == 200
    data = response.json()
    print(f"Available Scenarios ({len(data)}):", [s["name"] for s in data])
    assert len(data) > 0

def test_simulation_workflow_a42():
    print("\n--- Testing Full Step-by-Step Simulation Workflow (Section A-42 Scenario) ---")
    
    # Run step 1 to 6 sequentially
    for step in range(1, 7):
        print(f"Triggering Simulation Step {step}/6...")
        response = client.post("/api/simulation/run-step", json={
            "scenario_type": "A-42-fracture",
            "step": step
        })
        assert response.status_code == 200
        result = response.json()
        
        print(f"  [ST-{step}] Responding Agent: {result['agent']}")
        print(f"  [ST-{step}] Action Summary: {result['message']}")
        print(f"  [ST-{step}] DB Changes Logged: {result['db_changes']}")
        
        # Check monologue structure
        monologue = result["data"]
        for key in ["thought", "analysis", "decision", "communication", "coordination", "action"]:
            assert key in monologue
            
    print("Agent simulation workflow integration tested successfully.")

def test_top_level_api_routes():
    prediction = client.post("/api/predict", json={
        "scenario_type": "A-42-fracture",
        "step": 1
    })
    assert prediction.status_code == 200
    assert prediction.json()["agent"] == "TrackHealthAgent"

    analysis = client.post("/api/analyze", json={
        "scenario_type": "A-42-fracture"
    })
    assert analysis.status_code == 200
    assert analysis.json()["status"] == "resolved"

if __name__ == "__main__":
    print("==================================================")
    print("ASTRA RAIL BACKEND TELEMETRY VERIFICATION RUN")
    print("==================================================")
    try:
        test_health()
        test_stats()
        test_stations()
        test_trains()
        test_simulation_scenarios()
        test_simulation_workflow_a42()
        print("\n==================================================")
        print("[SUCCESS] ALL ENDPOINT AND AGENT SIMULATION TESTS PASSED")
        print("==================================================")
    except Exception as e:
        print("\n[FAILURE] TEST FAILURE DETECTED:")
        import traceback
        traceback.print_exc()
        exit(1)
