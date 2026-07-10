-- ====================================================================
-- APEXOS DATABASE SCHEMA (SQLite DDL)
-- Formula 1 Relational Data Model for Virtual Race Engineer Dashboard
-- ====================================================================

-- 1. CIRCUITS TABLE
CREATE TABLE IF NOT EXISTS circuits (
    circuitId INTEGER PRIMARY KEY,
    circuitRef TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    country TEXT,
    lat REAL,
    lng REAL,
    alt INTEGER,
    url TEXT
);

-- 2. CONSTRUCTORS TABLE
CREATE TABLE IF NOT EXISTS constructors (
    constructorId INTEGER PRIMARY KEY,
    constructorRef TEXT NOT NULL,
    name TEXT NOT NULL,
    nationality TEXT,
    url TEXT
);

-- 3. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS drivers (
    driverId INTEGER PRIMARY KEY,
    driverRef TEXT NOT NULL,
    number INTEGER,
    code TEXT,
    forename TEXT NOT NULL,
    surname TEXT NOT NULL,
    dob TEXT,
    nationality TEXT,
    url TEXT
);

-- 4. RACES TABLE
CREATE TABLE IF NOT EXISTS races (
    raceId INTEGER PRIMARY KEY,
    year INTEGER NOT NULL,
    round INTEGER NOT NULL,
    circuitId INTEGER NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    url TEXT,
    fp1_date TEXT,
    fp1_time TEXT,
    fp2_date TEXT,
    fp2_time TEXT,
    fp3_date TEXT,
    fp3_time TEXT,
    quali_date TEXT,
    quali_time TEXT,
    sprint_date TEXT,
    sprint_time TEXT,
    FOREIGN KEY(circuitId) REFERENCES circuits(circuitId)
);

-- 5. RESULTS TABLE
CREATE TABLE IF NOT EXISTS results (
    resultId INTEGER PRIMARY KEY,
    raceId INTEGER NOT NULL,
    driverId INTEGER NOT NULL,
    constructorId INTEGER NOT NULL,
    number INTEGER,
    grid INTEGER NOT NULL,
    position INTEGER,
    positionText TEXT,
    positionOrder INTEGER NOT NULL,
    points REAL NOT NULL,
    laps INTEGER NOT NULL,
    time TEXT,
    milliseconds INTEGER,
    fastestLap INTEGER,
    rank INTEGER,
    fastestLapTime TEXT,
    fastestLapSpeed REAL,
    statusId INTEGER,
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(driverId) REFERENCES drivers(driverId),
    FOREIGN KEY(constructorId) REFERENCES constructors(constructorId)
);

-- 6. LAP TIMES TABLE (Composite Primary Key on raceId, driverId, lap)
CREATE TABLE IF NOT EXISTS lap_times (
    raceId INTEGER NOT NULL,
    driverId INTEGER NOT NULL,
    lap INTEGER NOT NULL,
    position INTEGER,
    time TEXT,
    milliseconds INTEGER,
    PRIMARY KEY (raceId, driverId, lap),
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(driverId) REFERENCES drivers(driverId)
);

-- 7. PIT STOPS TABLE (Composite Primary Key on raceId, driverId, stop)
CREATE TABLE IF NOT EXISTS pit_stops (
    raceId INTEGER NOT NULL,
    driverId INTEGER NOT NULL,
    stop INTEGER NOT NULL,
    lap INTEGER NOT NULL,
    time TEXT NOT NULL,
    duration TEXT,
    milliseconds INTEGER,
    PRIMARY KEY (raceId, driverId, stop),
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(driverId) REFERENCES drivers(driverId)
);

-- 8. QUALIFYING TABLE
CREATE TABLE IF NOT EXISTS qualifying (
    qualifyId INTEGER PRIMARY KEY,
    raceId INTEGER NOT NULL,
    driverId INTEGER NOT NULL,
    constructorId INTEGER NOT NULL,
    number INTEGER,
    position INTEGER,
    q1 TEXT,
    q2 TEXT,
    q3 TEXT,
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(driverId) REFERENCES drivers(driverId),
    FOREIGN KEY(constructorId) REFERENCES constructors(constructorId)
);

-- 9. CONSTRUCTOR RESULTS TABLE
CREATE TABLE IF NOT EXISTS constructor_results (
    constructorResultsId INTEGER PRIMARY KEY,
    raceId INTEGER NOT NULL,
    constructorId INTEGER NOT NULL,
    points REAL,
    status TEXT,
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(constructorId) REFERENCES constructors(constructorId)
);

-- 10. CONSTRUCTOR STANDINGS TABLE
CREATE TABLE IF NOT EXISTS constructor_standings (
    constructorStandingsId INTEGER PRIMARY KEY,
    raceId INTEGER NOT NULL,
    constructorId INTEGER NOT NULL,
    points REAL NOT NULL,
    position INTEGER,
    positionText TEXT,
    wins INTEGER NOT NULL,
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(constructorId) REFERENCES constructors(constructorId)
);

-- 11. DRIVER STANDINGS TABLE
CREATE TABLE IF NOT EXISTS driver_standings (
    driverStandingsId INTEGER PRIMARY KEY,
    raceId INTEGER NOT NULL,
    driverId INTEGER NOT NULL,
    points REAL NOT NULL,
    position INTEGER,
    positionText TEXT,
    wins INTEGER NOT NULL,
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(driverId) REFERENCES drivers(driverId)
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- Speed up core operations like filtering, grouping, and joining
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_races_circuit ON races(circuitId);
CREATE INDEX IF NOT EXISTS idx_races_year ON races(year);

CREATE INDEX IF NOT EXISTS idx_results_race_driver ON results(raceId, driverId);
CREATE INDEX IF NOT EXISTS idx_results_constructor ON results(constructorId);

CREATE INDEX IF NOT EXISTS idx_lap_times_lookup ON lap_times(raceId, driverId, lap);
CREATE INDEX IF NOT EXISTS idx_pit_stops_lookup ON pit_stops(raceId, driverId, lap);

CREATE INDEX IF NOT EXISTS idx_qualifying_race_driver ON qualifying(raceId, driverId);
CREATE INDEX IF NOT EXISTS idx_qualifying_constructor ON qualifying(constructorId);

CREATE INDEX IF NOT EXISTS idx_constructor_standings_lookup ON constructor_standings(raceId, constructorId);
CREATE INDEX IF NOT EXISTS idx_driver_standings_lookup ON driver_standings(raceId, driverId);
