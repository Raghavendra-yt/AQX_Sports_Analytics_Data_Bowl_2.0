import os
import csv
import sqlite3
import json
import math
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
import numpy as np

# ====================================================================
# APEXOS PURE-PYTHON UTILS & MATH
# ====================================================================

def parse_time_to_ms(time_str):
    """
    Parses a time string formatted as 'M:SS.mmm' or 'SS.mmm' into milliseconds.
    Handles F1 time formats from qualifying.csv and lap_times.csv.
    """
    if not time_str or time_str == r'\N' or time_str == '':
        return None
    try:
        time_str = str(time_str).strip()
        if ':' in time_str:
            parts = time_str.split(':')
            minutes = int(parts[0])
            sec_parts = parts[1].split('.')
            seconds = int(sec_parts[0])
            ms_part = sec_parts[1] if len(sec_parts) > 1 else '0'
        else:
            minutes = 0
            sec_parts = time_str.split('.')
            seconds = int(sec_parts[0])
            ms_part = sec_parts[1] if len(sec_parts) > 1 else '0'
            
        # Standardize millisecond padding (e.g. '3' -> 300, '35' -> 350, '352' -> 352)
        ms_part = ms_part.ljust(3, '0')[:3]
        milliseconds = int(ms_part)
        
        return minutes * 60000 + seconds * 1000 + milliseconds
    except Exception:
        return None

def mean(lst):
    if not lst:
        return 0.0
    return sum(lst) / len(lst)

def std_dev(lst):
    n = len(lst)
    if n < 2:
        return 0.0
    avg = mean(lst)
    variance = sum((x - avg) ** 2 for x in lst) / n
    return math.sqrt(variance)

def linear_regression(x, y):
    n = len(x)
    if n < 2:
        return 0.0, 0.0
    mean_x = mean(x)
    mean_y = mean(y)
    covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    variance = sum((x[i] - mean_x) ** 2 for i in range(n))
    if variance == 0:
        return 0.0, mean_y
    slope = covariance / variance
    intercept = mean_y - slope * mean_x
    return slope, intercept

# ====================================================================
# OFFLINE SQLITE LOADER & INGESTION
# ====================================================================

DB_PATH = "apexos_cache.db"  # Use local file-based database for persistence
conn = None

DATA_DIR = "data"

def get_csv_path(filename):
    path = os.path.join(DATA_DIR, filename)
    if os.path.exists(path):
        return path
    return filename

def init_db():
    """
    Loads all F1 CSV data using built-in CSV module and loads it into SQLite.
    Filters by default to modern era (year >= 2021) for speed.
    """
    global conn
    
    # Connect to SQLite file (provides persistent cache and thread safety)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    
    # 1. Execute schema.sql DDL
    if not os.path.exists("schema.sql"):
        raise FileNotFoundError("schema.sql is missing from the workspace root.")
        
    with open("schema.sql", "r") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    
    # Check if data is already loaded to avoid duplicate inserts
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM races")
    if cursor.fetchone()[0] > 0:
        print("Database cache detected. Skipping CSV ingestion.")
        return
        
    print("ApexOS: Ingesting CSV datasets into SQLite offline cache...")
    
    # 2. Get modern race IDs (year >= 2021) from races.csv
    modern_race_ids = set()
    races_rows = []
    with open(get_csv_path("races.csv"), "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                year = int(row["year"])
                if year >= 2021:
                    modern_race_ids.add(int(row["raceId"]))
                    # Keep row
                    races_rows.append(row)
            except ValueError:
                pass
                
    # 3. Helper to insert CSV rows into SQLite table
    def load_table(csv_path, table_name, filter_by_race=False):
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [col_info[1] for col_info in cursor.fetchall()]
        
        if not os.path.exists(csv_path):
            print(f"Warning: {csv_path} not found.")
            return
            
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            placeholders = ", ".join(["?"] * len(columns))
            insert_query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
            
            chunk = []
            for row in reader:
                if filter_by_race and "raceId" in row:
                    try:
                        r_id = int(row["raceId"])
                        if r_id not in modern_race_ids:
                            continue
                    except ValueError:
                        continue
                        
                vals = []
                for col in columns:
                    val = row.get(col)
                    if val == "\\N" or val == "" or val is None:
                        vals.append(None)
                    else:
                        # Try casting to float/int
                        try:
                            if "." in val:
                                vals.append(float(val))
                            else:
                                vals.append(int(val))
                        except ValueError:
                            vals.append(val)
                chunk.append(vals)
                if len(chunk) >= 5000:
                    cursor.executemany(insert_query, chunk)
                    chunk = []
            if chunk:
                cursor.executemany(insert_query, chunk)
        conn.commit()

    # Load all tables
    load_table(get_csv_path("circuits.csv"), "circuits")
    load_table(get_csv_path("constructors.csv"), "constructors")
    load_table(get_csv_path("drivers.csv"), "drivers")
    
    # Load races (which we already filtered in-memory)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(races)")
    columns = [col[1] for col in cursor.fetchall()]
    placeholders = ", ".join(["?"] * len(columns))
    insert_query = f"INSERT INTO races ({', '.join(columns)}) VALUES ({placeholders})"
    races_data = []
    for row in races_rows:
        vals = []
        for col in columns:
            val = row.get(col)
            if val == "\\N" or val == "" or val is None:
                vals.append(None)
            else:
                try:
                    vals.append(float(val) if "." in val else int(val))
                except ValueError:
                    vals.append(val)
        races_data.append(vals)
    cursor.executemany(insert_query, races_data)
    conn.commit()
    
    # Load the remaining tables, filtering by raceId >= 2021
    load_table(get_csv_path("results.csv"), "results", filter_by_race=True)
    load_table(get_csv_path("lap_times.csv"), "lap_times", filter_by_race=True)
    load_table(get_csv_path("pit_stops.csv"), "pit_stops", filter_by_race=True)
    load_table(get_csv_path("qualifying.csv"), "qualifying", filter_by_race=True)
    load_table(get_csv_path("constructor_results.csv"), "constructor_results", filter_by_race=True)
    load_table(get_csv_path("constructor_standings.csv"), "constructor_standings", filter_by_race=True)
    load_table(get_csv_path("driver_standings.csv"), "driver_standings", filter_by_race=True)
    
    print(f"Data ingestion completed. Loaded {len(modern_race_ids)} races & telemetry datasets.")

# ====================================================================
# API IMPLEMENTATION LOGIC
# ====================================================================

def get_metadata():
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT DISTINCT d.driverId, d.forename, d.surname, d.code, d.nationality
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        ORDER BY d.surname, d.forename
    """)
    drivers = [
        {
            "driverId": row["driverId"],
            "code": row["code"] or row["surname"][:3].upper(),
            "fullName": f"{row['forename']} {row['surname']}",
            "nationality": row["nationality"]
        }
        for row in cursor.fetchall()
    ]
    
    cursor.execute("""
        SELECT DISTINCT c.circuitId, c.name, c.location, c.country
        FROM circuits c
        JOIN races r ON c.circuitId = r.circuitId
        ORDER BY c.name
    """)
    circuits = [
        {
            "circuitId": row["circuitId"],
            "name": row["name"],
            "location": row["location"],
            "country": row["country"]
        }
        for row in cursor.fetchall()
    ]
    
    cursor.execute("""
        SELECT DISTINCT con.constructorId, con.name, con.nationality
        FROM constructors con
        JOIN results r ON con.constructorId = r.constructorId
        ORDER BY con.name
    """)
    constructors = [
        {
            "constructorId": row["constructorId"],
            "name": row["name"],
            "nationality": row["nationality"]
        }
        for row in cursor.fetchall()
    ]
    
    return {
        "drivers": drivers,
        "circuits": circuits,
        "constructors": constructors
    }

def get_driver_pace(driverId, circuitId):
    cursor = conn.cursor()
    
    # 1. Latest race at circuit for driver
    cursor.execute("""
        SELECT r.raceId, r.name, r.year, r.date
        FROM races r
        JOIN lap_times lt ON r.raceId = lt.raceId
        WHERE r.circuitId = ? AND lt.driverId = ?
        ORDER BY r.year DESC, r.round DESC
        LIMIT 1
    """, (circuitId, driverId))
    
    race_row = cursor.fetchone()
    if not race_row:
        return {"error": "No telemetry data found for the selected combinations in the modern era."}
        
    race_id = race_row["raceId"]
    race_name = race_row["name"]
    race_year = race_row["year"]
    
    # 2. Pit stops
    cursor.execute("""
        SELECT stop, lap, milliseconds
        FROM pit_stops
        WHERE raceId = ? AND driverId = ?
        ORDER BY stop ASC
    """, (race_id, driverId))
    pit_stops = [dict(row) for row in cursor.fetchall()]
    pit_laps = [ps["lap"] for ps in pit_stops]
    
    # 3. Lap times
    cursor.execute("""
        SELECT lap, milliseconds, time
        FROM lap_times
        WHERE raceId = ? AND driverId = ?
        ORDER BY lap ASC
    """, (race_id, driverId))
    laps = [dict(row) for row in cursor.fetchall()]
    
    if not laps:
        return {"error": "No lap times found."}
        
    stint_data = []
    current_stint_num = 1
    stint_laps_list = []
    
    for i, lap_info in enumerate(laps):
        lap_num = lap_info["lap"]
        lap_time = lap_info["milliseconds"]
        stint_lap_num = len(stint_laps_list) + 1
        
        stint_laps_list.append({
            "lap": lap_num,
            "stintLap": stint_lap_num,
            "lapTimeMs": lap_time,
            "lapTimeStr": lap_info["time"]
        })
        
        if lap_num in pit_laps or i == len(laps) - 1:
            n_laps = len(stint_laps_list)
            if n_laps >= 2:
                x = [item["stintLap"] for item in stint_laps_list]
                y = [item["lapTimeMs"] for item in stint_laps_list]
                
                # Filter out first/last lap to exclude pit speed limits from slope
                x_filtered = [x[k] for k in range(n_laps) if k > 0 and k < n_laps - 1]
                y_filtered = [y[k] for k in range(n_laps) if k > 0 and k < n_laps - 1]
                
                if len(x_filtered) >= 2:
                    slope, intercept = linear_regression(x_filtered, y_filtered)
                else:
                    slope, intercept = linear_regression(x, y)
                
                # Rolling Standard Deviation (window = 3)
                rolling_stds = []
                for idx in range(n_laps):
                    if idx >= 2:
                        window = y[idx-2 : idx+1]
                        rolling_stds.append(std_dev(window))
                    else:
                        rolling_stds.append(None)
                        
                stint_std = std_dev(y)
                stint_laps_processed = []
                for idx, item in enumerate(stint_laps_list):
                    pred_ms = slope * item["stintLap"] + intercept
                    diff = item["lapTimeMs"] - pred_ms
                    is_anomaly = diff > (1.5 * stint_std) and diff > 2000
                    
                    stint_laps_processed.append({
                        **item,
                        "rollingStdMs": rolling_stds[idx],
                        "predictedMs": pred_ms,
                        "anomaly": bool(is_anomaly)
                    })
                
                valid_stds = [std for std in rolling_stds if std is not None]
                avg_std = mean(valid_stds) if valid_stds else 0.0
                
                stint_data.append({
                    "stintNumber": current_stint_num,
                    "lapsCount": n_laps,
                    "slope": slope,
                    "consistency": avg_std,
                    "laps": stint_laps_processed
                })
            elif n_laps == 1:
                stint_data.append({
                    "stintNumber": current_stint_num,
                    "lapsCount": 1,
                    "slope": 0.0,
                    "consistency": 0.0,
                    "laps": [{
                        **stint_laps_list[0],
                        "rollingStdMs": None,
                        "predictedMs": float(stint_laps_list[0]["lapTimeMs"]),
                        "anomaly": False
                    }]
                })
            
            current_stint_num += 1
            stint_laps_list = []
            
    return {
        "raceId": race_id,
        "raceName": race_name,
        "year": race_year,
        "pitStopsCount": len(pit_stops),
        "stints": stint_data
    }

def get_pit_strategy(circuitId, driverId1, driverId2, currentGap, tires1Age):
    cursor = conn.cursor()
    
    # 1. Pit lane delta at circuit
    cursor.execute("""
        SELECT ps.milliseconds
        FROM pit_stops ps
        JOIN races r ON ps.raceId = r.raceId
        WHERE r.circuitId = ? AND ps.milliseconds < 60000
    """, (circuitId,))
    pit_times = [row["milliseconds"] for row in cursor.fetchall()]
    
    if len(pit_times) >= 5:
        avg_pit_ms = mean(pit_times)
        std_pit_ms = std_dev(pit_times)
    else:
        avg_pit_ms = 22500.0
        std_pit_ms = 1200.0
        
    avg_pit_duration = avg_pit_ms / 1000.0
    std_pit_duration = std_pit_ms / 1000.0
    
    # 2. Tire wear rate D of driver 1 at this circuit
    cursor.execute("""
        SELECT r.raceId
        FROM races r
        JOIN lap_times lt ON r.raceId = lt.raceId
        WHERE r.circuitId = ? AND lt.driverId = ?
        ORDER BY r.year DESC LIMIT 2
    """, (circuitId, driverId1))
    recent_races = [row["raceId"] for row in cursor.fetchall()]
    
    deg_rate = 0.08  # Default 80ms degradation per lap
    if recent_races:
        race_ids_str = ",".join(map(str, recent_races))
        cursor.execute(f"""
            SELECT milliseconds
            FROM lap_times
            WHERE raceId IN ({race_ids_str}) AND driverId = ?
            ORDER BY raceId, lap ASC
        """, (driverId1,))
        laps = [row["milliseconds"] for row in cursor.fetchall()]
        
        if len(laps) > 10:
            deltas = [laps[k] - laps[k-1] for k in range(1, len(laps))]
            clean_deltas = [d for d in deltas if -2000 < d < 2000]
            if clean_deltas:
                deg_rate = max(mean(clean_deltas) / 1000.0, 0.02)
                
    base_grip_advantage = 1.1
    estimated_gain = base_grip_advantage + (deg_rate * tires1Age)
    margin = estimated_gain - currentGap
    
    # Sigmoid success probability
    pit_variance_factor = max(std_pit_duration * 1.5, 1.0)
    try:
        probability = 100.0 / (1.0 + math.exp(-1.8 * margin / pit_variance_factor))
    except OverflowError:
        probability = 0.0 if margin < 0 else 100.0
    probability = max(1.0, min(99.0, probability))
    
    if probability >= 80.0:
        recommendation = "HIGHLY RECOMMENDED: The undercut margin is extremely positive. Trigger pit entry immediately."
    elif probability >= 50.0:
        recommendation = "MARGINAL OPTION: Gap is tight. Pit stop speed and traffic-free out-lap will be decisive."
    else:
        recommendation = "NOT RECOMMENDED: High risk of emerging behind. Remain on track and search for an overcut window."
        
    return {
        "circuitId": circuitId,
        "avgPitDuration": round(avg_pit_duration, 2),
        "pitStopStd": round(std_pit_duration, 2),
        "tireDegRate": round(deg_rate, 3),
        "estimatedOutLapGain": round(estimated_gain, 2),
        "undercutProbability": round(probability, 1),
        "margin": round(margin, 2),
        "recommendation": recommendation
    }

def get_team_synergy(constructorId, year):
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT raceId, name, round
        FROM races
        WHERE year = ?
        ORDER BY round ASC
    """, (year,))
    races = [dict(row) for row in cursor.fetchall()]
    if not races:
        return {"error": f"No races found for season {year}."}
        
    race_ids_str = ",".join([str(r["raceId"]) for r in races])
    
    cursor.execute("SELECT name FROM constructors WHERE constructorId = ?", (constructorId,))
    constructor_row = cursor.fetchone()
    constructor_name = constructor_row["name"] if constructor_row else "Unknown Constructor"
    
    cursor.execute(f"""
        SELECT DISTINCT q.driverId, d.code, d.forename, d.surname
        FROM qualifying q
        JOIN drivers d ON q.driverId = d.driverId
        WHERE q.constructorId = ? AND q.raceId IN ({race_ids_str})
    """, (constructorId,))
    drivers = [dict(row) for row in cursor.fetchall()]
    
    if len(drivers) < 2:
        return {"error": "Constructor did not have at least two qualifying drivers in this season."}
        
    # Get top 2 drivers by participation counts
    driver_counts = {}
    for d in drivers:
        cursor.execute(f"SELECT COUNT(*) FROM qualifying WHERE constructorId = ? AND driverId = ? AND raceId IN ({race_ids_str})", (constructorId, d["driverId"]))
        driver_counts[d["driverId"]] = cursor.fetchone()[0]
        
    sorted_drivers = sorted(drivers, key=lambda x: driver_counts[x["driverId"]], reverse=True)
    driver_a = sorted_drivers[0]
    driver_b = sorted_drivers[1]
    
    driver_a_id = driver_a["driverId"]
    driver_b_id = driver_b["driverId"]
    
    cursor.execute(f"""
        SELECT driverId, SUM(points) as total_points
        FROM results
        WHERE constructorId = ? AND raceId IN ({race_ids_str}) AND driverId IN (?, ?)
        GROUP BY driverId
    """, (constructorId, driver_a_id, driver_b_id))
    points_rows = cursor.fetchall()
    
    points_map = {row["driverId"]: row["total_points"] for row in points_rows}
    driver_a_points = points_map.get(driver_a_id, 0.0)
    driver_b_points = points_map.get(driver_b_id, 0.0)
    
    cursor.execute(f"""
        SELECT raceId, driverId, position, q1, q2, q3
        FROM qualifying
        WHERE constructorId = ? AND driverId IN (?, ?) AND raceId IN ({race_ids_str})
    """, (constructorId, driver_a_id, driver_b_id))
    quali_rows = cursor.fetchall()
    
    quali_data = {}
    for row in quali_rows:
        r_id = row["raceId"]
        dr_id = row["driverId"]
        if r_id not in quali_data:
            quali_data[r_id] = {}
        quali_data[r_id][dr_id] = dict(row)
        
    h2h_wins_a = 0
    h2h_wins_b = 0
    quali_gaps_ms = []
    race_history = []
    
    for r in races:
        race_id = r["raceId"]
        if race_id not in quali_data or driver_a_id not in quali_data[race_id] or driver_b_id not in quali_data[race_id]:
            continue
            
        qa = quali_data[race_id][driver_a_id]
        qb = quali_data[race_id][driver_b_id]
        
        time_a, time_b = None, None
        
        if qa["q3"] and qb["q3"] and qa["q3"] != r'\N' and qb["q3"] != r'\N':
            time_a = parse_time_to_ms(qa["q3"])
            time_b = parse_time_to_ms(qb["q3"])
        elif qa["q2"] and qb["q2"] and qa["q2"] != r'\N' and qb["q2"] != r'\N':
            time_a = parse_time_to_ms(qa["q2"])
            time_b = parse_time_to_ms(qb["q2"])
        elif qa["q1"] and qb["q1"] and qa["q1"] != r'\N' and qb["q1"] != r'\N':
            time_a = parse_time_to_ms(qa["q1"])
            time_b = parse_time_to_ms(qb["q1"])
            
        if time_a is not None and time_b is not None:
            gap_ms = time_b - time_a
            quali_gaps_ms.append(gap_ms)
            
            if gap_ms < 0:
                h2h_wins_b += 1
                winner = driver_b["code"]
            else:
                h2h_wins_a += 1
                winner = driver_a["code"]
                
            cursor.execute("SELECT positionOrder, points FROM results WHERE raceId = ? AND driverId = ?", (race_id, driver_a_id))
            res_a = cursor.fetchone()
            cursor.execute("SELECT positionOrder, points FROM results WHERE raceId = ? AND driverId = ?", (race_id, driver_b_id))
            res_b = cursor.fetchone()
            
            race_history.append({
                "raceName": r["name"].replace("Grand Prix", "GP"),
                "round": r["round"],
                "qualiGapMs": gap_ms,
                "driverAPos": res_a["positionOrder"] if res_a else None,
                "driverBPos": res_b["positionOrder"] if res_b else None,
                "driverAPoints": res_a["points"] if res_a else 0.0,
                "driverBPoints": res_b["points"] if res_b else 0.0,
                "winner": winner
            })
            
    avg_gap = mean(quali_gaps_ms) if quali_gaps_ms else 0.0
    total_team_points = driver_a_points + driver_b_points
    points_share_a = driver_a_points / total_team_points if total_team_points > 0 else 0.5
    parity_diff = abs(points_share_a - 0.5)
    
    harmony = 85.0
    abs_avg_gap = abs(avg_gap)
    if abs_avg_gap < 80.0:
        harmony -= 15.0
    elif abs_avg_gap > 450.0:
        harmony -= 20.0
    harmony -= parity_diff * 40.0
    harmony = max(20.0, min(98.0, harmony))
    
    point_risk = 20.0 + (parity_diff * 140.0)
    if total_team_points < 10.0:
        point_risk = max(point_risk, 80.0)
    point_risk = max(10.0, min(95.0, point_risk))
    
    return {
        "constructorName": constructor_name,
        "year": year,
        "driverA": {
            "driverId": driver_a_id,
            "code": driver_a["code"],
            "fullName": f"{driver_a['forename']} {driver_a['surname']}",
            "points": driver_a_points
        },
        "driverB": {
            "driverId": driver_b_id,
            "code": driver_b["code"],
            "fullName": f"{driver_b['forename']} {driver_b['surname']}",
            "points": driver_b_points
        },
        "qualiHeadToHead": [h2h_wins_a, h2h_wins_b],
        "avgQualiGapMs": round(avg_gap, 1),
        "teamHarmonyScore": round(harmony, 1),
        "pointRiskScore": round(point_risk, 1),
        "raceHistory": race_history
    }

def get_ai_prediction(driverId, circuitId):
    """
    Fits a quadratic polynomial regression curve to the latest stint's lap times
    for the selected driver at the circuit, predicting future degradation,
    the tire performance cliff, and the optimum pit entry window.
    """
    cursor = conn.cursor()
    
    # 1. Fetch the latest race round at this circuit for the driver
    cursor.execute("""
        SELECT r.raceId, r.name, r.year
        FROM races r
        JOIN lap_times lt ON r.raceId = lt.raceId
        WHERE r.circuitId = ? AND lt.driverId = ?
        ORDER BY r.year DESC, r.round DESC
        LIMIT 1
    """, (circuitId, driverId))
    race_row = cursor.fetchone()
    if not race_row:
        return {"error": "Insufficient telemetry data for AI training."}
    
    race_id = race_row["raceId"]
    
    # 2. Fetch all lap times for this driver in this race
    cursor.execute("""
        SELECT lap, milliseconds
        FROM lap_times
        WHERE raceId = ? AND driverId = ?
        ORDER BY lap ASC
    """, (race_id, driverId))
    laps = [dict(row) for row in cursor.fetchall()]
    
    # 3. Fetch pit stop laps
    cursor.execute("""
        SELECT lap FROM pit_stops WHERE raceId = ? AND driverId = ?
    """, (race_id, driverId))
    pit_laps = {row["lap"] for row in cursor.fetchall()}
    
    if len(laps) < 5:
         return {"error": "Not enough laps to train predictive AI."}
         
    # 4. Group laps by stint
    stints = []
    current_stint = []
    for i, lap in enumerate(laps):
        current_stint.append(lap)
        if lap["lap"] in pit_laps or i == len(laps) - 1:
            if len(current_stint) >= 3:
                stints.append(current_stint)
            current_stint = []
            
    if not stints:
        stints = [laps]
        
    # We predict future times for the LATEST stint
    target_stint = stints[-1]
    stint_laps = [l["lap"] for l in target_stint]
    stint_times = [l["milliseconds"] for l in target_stint]
    
    stint_lap_indices = list(range(1, len(stint_laps) + 1))
    
    # 5. Remove outliers (anomalies / safety cars / grid dropouts) to get clean training data
    median_time = np.median(stint_times)
    clean_indices = []
    clean_times = []
    for idx, t in zip(stint_lap_indices, stint_times):
        # Exclude laps that are > 12% slower than median stint time
        if t < median_time * 1.12:
            clean_indices.append(idx)
            clean_times.append(t)
            
    if len(clean_indices) < 3:
        clean_indices = stint_lap_indices
        clean_times = stint_times
        
    # 6. Fit quadratic model y = ax^2 + bx + c using NumPy
    try:
        coefficients = np.polyfit(clean_indices, clean_times, 2)
        p = np.poly1d(coefficients)
    except Exception as e:
        return {"error": f"AI model training failed: {str(e)}"}
        
    # Calculate R^2 (Coefficient of Determination)
    y_mean = np.mean(clean_times)
    ss_tot = np.sum((clean_times - y_mean) ** 2)
    y_pred = p(clean_indices)
    ss_res = np.sum((clean_times - y_pred) ** 2)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    r2_pct = max(10.0, min(99.0, r2 * 100))
    
    # Predict next 25 laps
    last_stint_lap = stint_lap_indices[-1]
    future_stint_laps = list(range(last_stint_lap + 1, last_stint_lap + 26))
    future_times = p(future_stint_laps)
    
    # 7. Identify the Tire Performance Cliff
    # Cliff occurs when degradation pace loss relative to initial predicted stint pace exceeds 2.2 seconds
    initial_predicted_time = p(1)
    cliff_stint_lap = None
    for lap_idx, pred_time in zip(future_stint_laps, future_times):
        if pred_time - initial_predicted_time > 2200.0:
            cliff_stint_lap = lap_idx
            break
            
    if cliff_stint_lap is None:
        cliff_stint_lap = last_stint_lap + 10
        
    actual_race_cliff_lap = stint_laps[0] + cliff_stint_lap - 1
    
    # Optimum Pit Window: 3 laps prior up to the cliff lap itself
    pit_window_start = max(stint_laps[-1] + 1, actual_race_cliff_lap - 3)
    pit_window_end = actual_race_cliff_lap
    
    predictions = []
    # Historical stint laps
    for lap_info, idx in zip(target_stint, stint_lap_indices):
        predictions.append({
            "lap": lap_info["lap"],
            "stintLap": idx,
            "actualMs": lap_info["milliseconds"],
            "predictedMs": round(p(idx), 1),
            "isFuture": False
        })
        
    # Future predicted stint laps
    for idx, fut_lap in zip(future_stint_laps, future_times):
        actual_lap = stint_laps[0] + idx - 1
        predictions.append({
            "lap": actual_lap,
            "stintLap": idx,
            "actualMs": None,
            "predictedMs": round(fut_lap, 1),
            "isFuture": True
        })
        
    recommendation = (
        f"AI MODEL RECOMMENDATION: Tire cliff is predicted around Lap {actual_race_cliff_lap}. "
        f"We recommend pitting in the window of Laps {pit_window_start} - {pit_window_end} "
        f"to prevent severe pace degradation (estimated >2.2s drop). "
        f"Model Confidence: {r2_pct:.1f}% based on modern race lap variance."
    )
    
    return {
        "driverId": driverId,
        "circuitId": circuitId,
        "raceName": race_row["name"],
        "year": race_row["year"],
        "r2Score": round(r2_pct, 1),
        "tireCliffLap": actual_race_cliff_lap,
        "pitWindowStart": pit_window_start,
        "pitWindowEnd": pit_window_end,
        "recommendation": recommendation,
        "predictions": predictions
    }

# ====================================================================
# HTTP SERVER ROUTER
# ====================================================================

class ApexOSRequestHandler(BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        # Override to prevent logging cluttering user terminal
        pass

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)
        
        # Route handler map
        response_data = None
        status_code = 200
        
        try:
            if path == "/api/metadata":
                response_data = get_metadata()
            elif path == "/api/driver-pace":
                d_id = int(query_params.get("driverId", [0])[0])
                c_id = int(query_params.get("circuitId", [0])[0])
                response_data = get_driver_pace(d_id, c_id)
                if "error" in response_data:
                    status_code = 404
            elif path == "/api/ai-lap-prediction":
                d_id = int(query_params.get("driverId", [0])[0])
                c_id = int(query_params.get("circuitId", [0])[0])
                response_data = get_ai_prediction(d_id, c_id)
                if "error" in response_data:
                    status_code = 404
            elif path == "/api/pit-strategy":
                c_id = int(query_params.get("circuitId", [0])[0])
                d1 = int(query_params.get("driverId1", [0])[0])
                d2 = int(query_params.get("driverId2", [0])[0])
                gap = float(query_params.get("currentGap", [1.5])[0])
                t_age = int(query_params.get("tires1Age", [10])[0])
                response_data = get_pit_strategy(c_id, d1, d2, gap, t_age)
            elif path == "/api/team-synergy":
                con_id = int(query_params.get("constructorId", [0])[0])
                yr = int(query_params.get("year", [2023])[0])
                response_data = get_team_synergy(con_id, yr)
                if "error" in response_data:
                    status_code = 404
            else:
                status_code = 404
                response_data = {"detail": "Endpoint not found"}
        except Exception as e:
            status_code = 500
            response_data = {"detail": f"Internal Server Error: {str(e)}"}
            
        # Send response
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

def run_server():
    # 1. Ingest F1 data from CSVs locally into SQlite cache file
    init_db()
    
<<<<<<< HEAD
    # 2. Start HTTP server on port from environment variable or 8000, binding to 0.0.0.0 for cloud deployment
    port = int(os.environ.get("PORT", 8000))
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, ApexOSRequestHandler)
    print("\n==================================================")
    print("ApexOS: Offline Telemetry Backend Server Started!")
    print(f"Address: http://0.0.0.0:{port}")
=======
    # 2. Start HTTP server on port 8000
    server_address = ('127.0.0.1', 8000)
    httpd = HTTPServer(server_address, ApexOSRequestHandler)
    print("\n==================================================")
    print("ApexOS: Offline Telemetry Backend Server Started!")
    print("Address: http://127.0.0.1:8000")
    print("Swagger docs fallback: open any API url above to query")
>>>>>>> 0c350e62c8b8888800a70d98a33e71aabbeff455
    print("==================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutdown signal received. Exiting server.")
    finally:
        httpd.server_close()
        if conn:
            conn.close()

if __name__ == "__main__":
    run_server()
