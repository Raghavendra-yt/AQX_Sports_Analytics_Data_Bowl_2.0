# MERCEDES-AMG // APEXOS
### F1 Telemetry Pit-Wall Command Station & Cognitive Analytics Hub

APEXOS is an ultra-premium, high-fidelity real-time telemetry analysis dashboard designed for the **Mercedes-AMG Petronas F1 Team**. It integrates real-time racing telemetry, predictive AI strategy modeling, and interactive cockpit control channels to help race engineers optimize pace curves, tire degradation rates, and pit stops.

---

## 🌟 Key Features

### 1. Floating Canopy HUD Navigation
- A floating visor HUD design with a carbon-fiber weave background and glowing neon status markers.
- Supports smooth tab routing between the **Driver Command Station** and **Strategy Control Room**.

### 2. F1 Bento Grid Widgets
- High-contrast widgets displaying critical live metrics:
  - **Tire Deg Rate**: Features an animated circular SVG progress gauge showing active tire health percentages.
  - **Consistency Index**: Monospaced pace ratings with a glowing `STABLE` status chip and pulsing green LEDs.
  - **Average Pace**: A retro clock visor panel tracking stint averages.
  - **Garage Stats**: Split-meter grid summaries displaying pit stops and stint history.

### 3. Live Telemetry & Cockpit HUD Feed
- **Stint History Mode**: Visualizes historical pace curves, tire wear trends, and variance margins using glowing area charts.
- **Live Delta Feed**: Simulates active car telemetry:
  - Center cockpit dashboard tracking Gear (`G7`), Speed (`318 KM/H`), and State of Charge (`SOC 88%`).
  - Ten-segment Engine RPM LED rev bar lighting up in green, yellow, and red.
  - Flashing green `DRS ACTIVE` indicator badge.

### 4. APEX Cognitive Strategy System
- An AI-powered strategy model tracking:
  - **Tire Cliff Predictions** (calculated using linear regression degradation curves).
  - **Optimum Pit Windows** (pit stop entry windows).
  - **AI Strategy Directives** (cognitive recommendation cards).

### 5. Track Radar & GPS Feed
- An interactive `<CircuitVisualizer />` that dynamically draws SVG vector paths for F1 circuits (Albert Park, Sakhir, Barcelona, Monaco, Silverstone, Spa-Francorchamps, Monza, Marina Bay, Interlagos, Suzuka, Yas Marina, Austin, Spielberg, Baku, Jeddah, Las Vegas, and Miami).
- Integrates a pulsing red active car locator dot traveling along the track layout to trace real-time car positioning, as well as Sector 1, Sector 2, and Sector 3 timing feeds.

### 6. Interactive Cockpit Controllers
- Custom telemetry sliders with glowing range channels and neon handles for adjusting **Engine Mode**, **Brake Balance**, and **Differential Entry**.
- Action feeds showing scrolling monospaced terminal radio logs from engineer-to-driver communications.

### 7. Strategy Control Room (Undercut Simulation)
- Predicts undercut/overcut success rates using a sigmoid probability model based on current gap, tire ages, and pit stop variance factors.

---

## 📐 Mathematical & Engineering Models Deep-Dive

### 1. Pace Degradation Coefficient (Linear Regression)
The degradation rate of tires (in seconds per lap) is calculated using a linear regression model over the stint lap times:
$$y = m \cdot x + c$$
Where:
- $y$ is the lap time (in milliseconds).
- $x$ is the stint lap number (1-indexed starting at the beginning of the stint).
- $m$ is the slope (degradation rate coefficient).
- $c$ is the intercept (estimated baseline pace on fresh tires).

To eliminate anomalies caused by pit lane speed limits, the backend automatically filters out the first and last laps of each stint before executing the regression fitting:
$$\text{Laps}_{\text{filtered}} = \{x_i \in \text{Stint} \mid 1 < i < N\}$$

### 2. Consistency Index Formulation
The driver's pace consistency index (0-100 scale) is derived from the Standard Deviation ($\sigma$) of the lap times in a stint:
$$\sigma = \sqrt{\frac{1}{N-1} \sum_{i=1}^N (y_i - \bar{y})^2}$$
$$\text{Consistency Index} = \max\left(0, 100 \cdot \left(1 - \frac{\sigma}{2000}\right)\right)$$
Where a higher index indicates highly repeatable laps, whereas a lower index reflects high pace variance (due to traffic, lockups, or safety car interventions).

### 3. Undercut/Overcut Success Probability (Sigmoid Formulation)
To determine whether an undercut attempt will succeed, the strategy engine models a sigmoid probability curve based on the track-specific pit stop duration margin:
$$\text{Estimated Gain} = \text{Base Grip Advantage} + (\text{Degradation Rate} \times \text{Tires Age})$$
$$\text{Margin} = \text{Estimated Gain} - \text{Current Gap}$$
$$\text{Probability} = \frac{100}{1 + e^{-1.8 \cdot \text{Margin} / \text{Pit Variance Factor}}}$$
Where $\text{Pit Variance Factor}$ represents the standard deviation of historical pit stop durations at that circuit. A probability $\ge 80\%$ triggers an immediate `HIGHLY RECOMMENDED` directive.

---

## 📡 API Endpoint Specifications

### 1. `GET /api/metadata`
Retrieves available drivers, circuits, and constructors from the database.
**Response Sample**:
```json
{
  "drivers": [
    { "driverId": 1, "code": "HAM", "fullName": "Lewis Hamilton", "nationality": "British" }
  ],
  "circuits": [
    { "circuitId": 6, "name": "Circuit de Monaco", "location": "Monte-Carlo", "country": "Monaco" }
  ],
  "constructors": [
    { "constructorId": 131, "name": "Mercedes", "nationality": "German" }
  ]
}
```

### 2. `GET /api/driver-pace?driverId={driverId}&circuitId={circuitId}`
Fetches stint-by-stint telemetry data from the driver's latest race at the specified circuit.
**Response Sample**:
```json
{
  "raceName": "Monaco Grand Prix",
  "year": 2023,
  "pitStopsCount": 1,
  "stints": [
    {
      "stintNumber": 1,
      "lapsCount": 32,
      "slope": 55.4,
      "consistency": 182.5,
      "laps": [
        { "lap": 1, "stintLap": 1, "lapTimeMs": 76500, "lapTimeStr": "1:16.500", "isAnomaly": false }
      ]
    }
  ]
}
```

### 3. `GET /api/ai-lap-prediction?driverId={driverId}&circuitId={circuitId}`
Runs a predictive model estimating tire degradation cliff points and pit stop windows.
**Response Sample**:
```json
{
  "r2Score": 94.6,
  "tireCliffLap": 28,
  "pitWindowStart": 24,
  "pitWindowEnd": 27,
  "recommendation": "Monitor degradation rate. Under current wear curves, tire cliff is projected on Lap 28. Plan pit entry in Window [24 - 27]."
}
```

### 4. `GET /api/pit-strategy?circuitId={circuitId}&driverId1={driverId1}&driverId2={driverId2}&currentGap={currentGap}&tires1Age={tires1Age}`
Simulates real-time pit undercut probabilities based on live race status inputs.

---

## 📊 Dataset Source
The historical F1 telemetry datasets (such as lap times, pit stops, results, races, circuits, and driver standings) compiled into the ApexOS engine were sourced from **[Kaggle.com](https://www.kaggle.com)**.

---

## 🛠️ Installation & Setup

### 1. Backend Server Setup
Start the local FastAPI-compatible HTTP backend:
```bash
python app.py
```
This automatically parses F1 database CSV files (e.g., `lap_times.csv`, `races.csv`, `circuits.csv`), compiles the structured SQLite database `apexos_cache.db`, and spins up the server on port `8000`.

### 2. Frontend client Setup
Install package node dependencies and compile the development server:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` to launch the console.

### 3. Demo Credentials
To bypass access security and log in immediately, use the **LOAD DEMO CREDENTIALS** button on the gateway screen or enter:
- **Access Identity**: `mercedes_admin`
- **Encryption Key**: `petronas_strategy`

### 4. API Verifications
To perform sanity checks and test endpoint latency:
```bash
python verify_backend.py
```
