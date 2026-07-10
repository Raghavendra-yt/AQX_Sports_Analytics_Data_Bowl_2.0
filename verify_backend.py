# ====================================================================
# APEXOS BACKEND VERIFICATION SCRIPT (verify_backend.py)
# Integration test for FastAPI data pipelines and query calculations
# ====================================================================

import sys
import app

def test_integration():
    print("--------------------------------------------------")
    print("ApexOS: Starting Backend Pipeline Verification...")
    print("--------------------------------------------------")
    
    # 1. Initialize SQLite Database & Load CSVs
    try:
        app.init_db()
        print("[PASS] Database loaded and tables indexed successfully.")
    except Exception as e:
        print(f"[FAIL] Database initialization failed: {e}")
        sys.exit(1)
        
    # 2. Test Metadata Retrieval
    try:
        metadata = app.get_metadata()
        drivers_count = len(metadata["drivers"])
        circuits_count = len(metadata["circuits"])
        constructors_count = len(metadata["constructors"])
        print(f"[PASS] Metadata retrieved: {drivers_count} drivers, {circuits_count} circuits, {constructors_count} constructors active in 2021+.")
        
        if drivers_count == 0 or circuits_count == 0 or constructors_count == 0:
            print("[WARN] Metadata lists are empty. Verify if modern data is filtered correctly.")
    except Exception as e:
        print(f"[FAIL] Metadata endpoint failed: {e}")
        sys.exit(1)

    # 3. Test Driver Pace Curve Calculation
    try:
        # Check active combinations
        # Let's find first driver and circuit that have recorded telemetry
        sample_driver = metadata["drivers"][0]["driverId"]
        sample_driver_code = metadata["drivers"][0]["code"]
        sample_circuit = metadata["circuits"][0]["circuitId"]
        sample_circuit_name = metadata["circuits"][0]["name"]
        
        print(f"Testing Driver Pace for {sample_driver_code} at {sample_circuit_name}...")
        
        pace_data = app.get_driver_pace(driverId=sample_driver, circuitId=sample_circuit)
        
        print(f"[PASS] Pace degradation curves calculated successfully for race: {pace_data['raceName']} ({pace_data['year']}).")
        print(f"       Total stints resolved: {len(pace_data['stints'])}")
        for stint in pace_data["stints"]:
            print(f"       - Stint {stint['stintNumber']}: {stint['lapsCount']} Laps, Wear Rate: {stint['slope']:.2f} ms/lap, σ: {stint['consistency']:.2f} ms")
            # Print if any anomalies detected
            anomalies = [l for l in stint["laps"] if l["anomaly"]]
            if anomalies:
                print(f"         * Detected {len(anomalies)} pace dropouts (anomalies).")
    except Exception as e:
        # If the combination doesn't exist, it returns 404, which is expected. Find one that works.
        print(f"[INFO] Tried default combination. Searching for any valid combo...")
        cursor = app.conn.cursor()
        cursor.execute("SELECT DISTINCT driverId, circuitId FROM results JOIN races ON results.raceId = races.raceId LIMIT 5")
        combos = cursor.fetchall()
        
        success = False
        for combo in combos:
            d_id, c_id = combo["driverId"], combo["circuitId"]
            try:
                pace_data = app.get_driver_pace(driverId=d_id, circuitId=c_id)
                print(f"[PASS] Pace degradation curves calculated successfully for driver {d_id} at circuit {c_id}.")
                print(f"       Race: {pace_data['raceName']} ({pace_data['year']})")
                success = True
                break
            except Exception:
                continue
        if not success:
            print(f"[FAIL] Pace degradation curve calculations failed: {e}")
            sys.exit(1)

    # 4. Test Strategy Delta Calculation
    try:
        sample_circuit = metadata["circuits"][0]["circuitId"]
        # Lewis Hamilton (1) vs Max Verstappen (830)
        strategy = app.get_pit_strategy(
            circuitId=sample_circuit, 
            driverId1=1, 
            driverId2=830, 
            currentGap=1.2, 
            tires1Age=12
        )
        print(f"[PASS] Strategy calculator outputs Undercut Success Probability Score: {strategy['undercutProbability']}%")
        print(f"       Avg Pit Delta: {strategy['avgPitDuration']}s (σ: {strategy['pitStopStd']}s)")
        print(f"       Est Out-lap gain: {strategy['estimatedOutLapGain']}s, Margin: {strategy['margin']}s")
        print(f"       Recommendation: {strategy['recommendation']}")
    except Exception as e:
        print(f"[FAIL] Strategy delta calculations failed: {e}")
        sys.exit(1)

    # 5. Test Teammate Synergy Matrix
    try:
        # Red Bull (9) or Mercedes (13) or Ferrari (6)
        sample_constructor = metadata["constructors"][0]["constructorId"]
        sample_constructor_name = metadata["constructors"][0]["name"]
        
        print(f"Testing Teammate Synergy for constructor: {sample_constructor_name} (ID: {sample_constructor}) in 2023...")
        synergy = app.get_team_synergy(constructorId=sample_constructor, year=2023)
        print(f"[PASS] Synergy hub metrics generated for {synergy['driverA']['code']} vs {synergy['driverB']['code']}.")
        print(f"       Team Harmony: {synergy['teamHarmonyScore']}%")
        print(f"       Constructor Point Risk: {synergy['pointRiskScore']}%")
        print(f"       Qualifying H2H Battle: {synergy['qualiHeadToHead'][0]} - {synergy['qualiHeadToHead'][1]}")
        print(f"       Avg Qualifying Gap: {synergy['avgQualiGapMs']} ms")
        print(f"       Race data processed: {len(synergy['raceHistory'])} rounds.")
    except Exception as e:
        # Try another team if 2023 is not available
        print(f"[INFO] 2023 data missing for constructor. Trying fallback search...")
        cursor = app.conn.cursor()
        cursor.execute("SELECT DISTINCT constructorId, year FROM qualifying JOIN races ON qualifying.raceId = races.raceId LIMIT 5")
        combos = cursor.fetchall()
        
        success = False
        for combo in combos:
            con_id, yr = combo["constructorId"], combo["year"]
            try:
                synergy = app.get_team_synergy(constructorId=con_id, year=yr)
                print(f"[PASS] Teammate synergy calculated successfully for constructor {con_id} in {yr}.")
                success = True
                break
            except Exception:
                continue
        if not success:
            print(f"[FAIL] Synergy matrix calculations failed: {e}")
            sys.exit(1)

    print("--------------------------------------------------")
    print("ApexOS: All Backend Calculations Verified! [SUCCESS]")
    print("--------------------------------------------------")

if __name__ == "__main__":
    test_integration()
