import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Compass, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Gauge, 
  Zap, 
  Sliders, 
  RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine
} from 'recharts';

// Detect local environment to point to backend server
const API_BASE = import.meta.env.VITE_API_BASE || '';

// F1 Circuit Track SVG layout mappings
const trackLayouts = {
  1: { // Albert Park
    path: "M 20,20 C 35,15 50,15 65,25 C 80,35 85,40 75,50 C 65,60 50,60 35,50 C 20,40 10,30 20,20 Z",
    sectors: ["28.1s", "22.4s", "30.5s"]
  },
  3: { // Bahrain
    path: "M 15,15 L 45,15 C 50,15 55,20 55,28 L 35,35 L 55,45 L 85,45 C 90,45 90,55 80,55 L 20,55 C 10,55 10,40 15,30 Z",
    sectors: ["29.4s", "38.5s", "22.9s"]
  },
  4: { // Catalunya
    path: "M 15,20 C 30,15 60,15 80,20 C 90,22 90,35 75,40 C 60,45 60,55 45,55 C 30,55 20,45 15,35 Z",
    sectors: ["21.8s", "28.9s", "25.7s"]
  },
  6: { // Monaco
    path: "M 25,40 C 20,40 10,35 10,25 C 10,15 25,10 35,10 C 45,10 50,15 55,20 C 60,25 70,30 85,25 C 95,20 90,45 80,45 C 70,45 65,40 60,40 C 55,40 50,45 40,45 Z",
    sectors: ["18.6s", "32.1s", "19.9s"]
  },
  9: { // Silverstone
    path: "M 15,25 C 20,10 35,10 45,15 C 55,20 65,15 75,25 C 85,35 90,30 85,45 C 80,60 65,55 55,45 C 45,35 35,45 25,45 Z",
    sectors: ["27.3s", "34.8s", "23.4s"]
  },
  13: { // Spa-Francorchamps
    path: "M 15,15 C 25,10 40,15 50,12 C 60,10 75,20 85,25 C 95,30 90,45 75,45 C 60,45 50,40 40,45 C 30,50 20,45 15,30 Z",
    sectors: ["30.1s", "46.2s", "27.8s"]
  },
  14: { // Monza
    path: "M 10,20 C 30,15 70,10 90,10 C 95,10 95,30 85,35 C 70,42 60,42 50,30 C 40,18 20,40 10,40 C 5,40 5,20 10,20 Z",
    sectors: ["25.8s", "26.4s", "27.1s"]
  },
  15: { // Singapore
    path: "M 15,20 L 40,15 L 60,20 L 75,18 L 85,28 L 70,35 L 55,38 L 40,45 L 20,42 Z",
    sectors: ["27.0s", "37.5s", "32.8s"]
  },
  18: { // Interlagos
    path: "M 15,30 C 20,15 35,10 50,15 C 65,20 80,30 75,45 C 70,60 50,55 40,40 C 30,25 20,45 15,45 Z",
    sectors: ["18.1s", "35.2s", "17.4s"]
  },
  22: { // Suzuka
    path: "M 15,35 C 25,25 45,35 60,25 C 75,15 85,25 75,35 C 65,45 45,35 30,45 C 15,55 10,45 15,35 Z",
    sectors: ["31.4s", "39.9s", "18.3s"]
  },
  24: { // Yas Marina
    path: "M 10,20 L 50,10 L 80,25 L 85,45 L 60,45 L 40,35 L 15,40 Z",
    sectors: ["17.3s", "35.9s", "39.2s"]
  },
  69: { // Americas
    path: "M 15,45 L 20,20 L 45,25 C 50,25 60,15 75,25 L 85,45 L 65,48 L 45,40 L 25,48 Z",
    sectors: ["25.1s", "37.4s", "31.9s"]
  },
  70: { // Red Bull Ring
    path: "M 10,30 L 15,10 L 45,15 L 75,25 C 80,27 80,35 70,40 L 40,45 L 20,40 Z",
    sectors: ["16.4s", "28.5s", "19.9s"]
  },
  73: { // Baku
    path: "M 10,40 L 10,15 L 50,15 L 50,30 L 85,30 L 85,40 Z",
    sectors: ["34.5s", "41.2s", "24.9s"]
  },
  77: { // Jeddah
    path: "M 10,45 C 10,20 15,10 20,10 C 25,10 28,25 28,45 C 28,50 15,50 10,45 Z",
    sectors: ["31.8s", "27.5s", "28.2s"]
  },
  79: { // Miami
    path: "M 15,30 L 15,15 L 85,15 L 85,35 L 55,35 L 40,45 Z",
    sectors: ["29.0s", "33.5s", "27.4s"]
  },
  80: { // Las Vegas
    path: "M 15,30 L 15,15 L 85,15 L 85,35 L 55,35 L 40,45 Z",
    sectors: ["26.5s", "31.2s", "24.9s"]
  }
};

function CircuitVisualizer({ circuitId, circuitName }) {
  const layout = trackLayouts[circuitId] || trackLayouts[6]; // Default to Monaco if not matched
  
  return (
    <div className="telemetry-card flex flex-col gap-3 bg-slate-950/60 border border-cyan-500/20">
      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
        <h4 className="font-telemetry font-bold text-xs uppercase text-cyan-400 flex items-center gap-1.5">
          <Compass size={14} className="text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          Track Radar & GPS Feed
        </h4>
        <span className="text-[8px] bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold px-2 py-0.5 rounded font-telemetry">
          LIVE POSITION
        </span>
      </div>

      <div className="h-[180px] bg-slate-900/40 rounded border border-slate-800/40 relative flex items-center justify-center p-4 overflow-hidden">
        {/* Radar grids */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(0,255,236,0.02)_1px,transparent_1px)] [background-size:12px_12px] opacity-60"></div>
        <div className="absolute w-24 h-24 border border-cyan-500/5 rounded-full animate-ping"></div>
        <div className="absolute w-40 h-40 border border-cyan-500/5 rounded-full"></div>
        
        {/* Track SVG */}
        <svg className="w-full h-full drop-shadow-[0_0_12px_rgba(0,255,236,0.3)]" viewBox="0 0 100 60">
          <path
            d={layout.path}
            fill="none"
            stroke="#00ffec"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Pulsing Active Car Tracker */}
          <circle r="4" fill="#ff1801" className="animate-pulse shadow-[0_0_10px_#ff1801]">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path={layout.path}
            />
          </circle>
          <circle r="2" fill="#fff">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path={layout.path}
            />
          </circle>
        </svg>

        {/* HUD coordinates */}
        <div className="absolute bottom-2 left-2 text-[8px] font-telemetry text-slate-500 uppercase">
          Track: {circuitName || 'UNKNOWN'}
        </div>
        <div className="absolute bottom-2 right-2 text-[8px] font-telemetry text-slate-500 uppercase">
          GPS: Lat: 43.7347, Lng: 7.4206
        </div>
      </div>

      {/* Sector Times */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-telemetry">
        <div className="bg-slate-900/60 p-1.5 border border-slate-900 rounded">
          <span className="text-[8px] text-slate-500 uppercase block font-bold">Sector 1</span>
          <span className="text-slate-200 font-bold">{layout.sectors[0]}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 border border-slate-900 rounded">
          <span className="text-[8px] text-slate-500 uppercase block font-bold">Sector 2</span>
          <span className="text-[#00ff87] font-bold">{layout.sectors[1]}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 border border-slate-900 rounded">
          <span className="text-[8px] text-slate-500 uppercase block font-bold">Sector 3</span>
          <span className="text-slate-200 font-bold">{layout.sectors[2]}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('driver-view');
  const [showProfile, setShowProfile] = useState(false);
  
  // Metadata states
  const [drivers, setDrivers] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Tab 1: Driver Command View states
  const [t1DriverId, setT1DriverId] = useState('');
  const [t1CircuitId, setT1CircuitId] = useState('');
  const [t1Data, setT1Data] = useState(null);
  const [t1Loading, setT1Loading] = useState(false);
  const [selectedStint, setSelectedStint] = useState('all');
  const [telemetryMode, setTelemetryMode] = useState('historical'); // 'historical' | 'live'
  const [t1AiData, setT1AiData] = useState(null);
  const [t1AiLoading, setT1AiLoading] = useState(false);

  // Tab 1 local simulation states
  const [localTelemetry, setLocalTelemetry] = useState(null);
  const [activeCommand, setActiveCommand] = useState('normal'); // 'normal' | 'push' | 'manage' | 'recharge'
  const [engineMode, setEngineMode] = useState('Strat 7');
  const [brakeBalance, setBrakeBalance] = useState(59.0);
  const [diffEntry, setDiffEntry] = useState(64);
  const [commandLogs, setCommandLogs] = useState([]);

  // Tab 2: Strategy Control Room states
  const [t2CircuitId, setT2CircuitId] = useState('');
  const [t2LeadDriverId, setT2LeadDriverId] = useState('');
  const [t2ChaserDriverId, setT2ChaserDriverId] = useState('');
  const [t2Gap, setT2Gap] = useState(1.2);
  const [t2TireAge, setT2TireAge] = useState(10);
  const [t2Data, setT2Data] = useState(null);
  const [t2Loading, setT2Loading] = useState(false);



  // Load metadata on mount
  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoadingMetadata(true);
      const res = await fetch(`${API_BASE}/api/metadata`);
      if (!res.ok) throw new Error('Failed to fetch initial dropdown lists.');
      const data = await res.json();
      
      setDrivers(data.drivers || []);
      setCircuits(data.circuits || []);
      setConstructors(data.constructors || []);
      
      // Set default values
      if (data.drivers.length > 0) {
        const hamilton = data.drivers.find(d => d.code === 'HAM');
        const russell = data.drivers.find(d => d.code === 'RUS');
        
        setT1DriverId(hamilton ? hamilton.driverId : data.drivers[0].driverId);
        setT2LeadDriverId(hamilton ? hamilton.driverId : data.drivers[0].driverId);
        setT2ChaserDriverId(russell ? russell.driverId : (data.drivers[1] ? data.drivers[1].driverId : data.drivers[0].driverId));
      }
      if (data.circuits.length > 0) {
        setT1CircuitId(data.circuits[0].circuitId);
        setT2CircuitId(data.circuits[0].circuitId);
      }

      
      setLoadingMetadata(false);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not connect to the FastAPI backend. Make sure uvicorn is running on port 8000.');
      setLoadingMetadata(false);
    }
  };

  // Fetch Tab 1 Telemetry
  useEffect(() => {
    if (t1DriverId && t1CircuitId && activeTab === 'driver-view') {
      fetchDriverPace();
    }
  }, [t1DriverId, t1CircuitId, activeTab]);

  const fetchDriverPace = async () => {
    try {
      setT1Loading(true);
      setT1AiLoading(true);
      setSelectedStint('all');
      
      const res = await fetch(`${API_BASE}/api/driver-pace?driverId=${t1DriverId}&circuitId=${t1CircuitId}`);
      if (!res.ok) {
        const errorDetail = await res.json();
        throw new Error(errorDetail.detail || 'Data not found.');
      }
      const data = await res.json();
      setT1Data(data);
      
      // Fetch AI prediction data
      try {
        const aiRes = await fetch(`${API_BASE}/api/ai-lap-prediction?driverId=${t1DriverId}&circuitId=${t1CircuitId}`);
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          setT1AiData(aiData);
        } else {
          setT1AiData(null);
        }
      } catch (aiErr) {
        console.error("AI telemetric prediction query failed:", aiErr);
        setT1AiData(null);
      }
      
      setErrorMessage('');
    } catch (err) {
      setT1Data(null);
      setT1AiData(null);
      setErrorMessage(err.message);
    } finally {
      setT1Loading(false);
      setT1AiLoading(false);
    }
  };

  // Synchronize local telemetry state when server data is loaded
  useEffect(() => {
    if (t1Data && !t1Data.error && t1Data.stints) {
      setLocalTelemetry(JSON.parse(JSON.stringify(t1Data)));
      const code = drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV';
      const initialLogs = [
        { id: '1', time: new Date().toLocaleTimeString(), text: `COMM_LINK: SECURE FEED ESTABLISHED WITH CAR ${code}`, type: 'info' },
        { id: '2', time: new Date().toLocaleTimeString(), text: `TELEMETRY: RESOLVED GP RACE HISTORY FOR ${t1Data.raceName || 'SESSION'}`, type: 'info' },
        { id: '3', time: new Date().toLocaleTimeString(), text: `DIAL_SYNC: ENGINE=Strat 7 | BBAL=59.0% | DIFF=64%`, type: 'info' },
        { id: '4', time: new Date().toLocaleTimeString(), text: `STATUS: STANDBY FOR DIRECTIVES FROM ENGINEER`, type: 'success' }
      ];
      setCommandLogs(initialLogs);
      setActiveCommand('normal');
      setEngineMode('Strat 7');
      setBrakeBalance(59.0);
      setDiffEntry(64);
    } else {
      setLocalTelemetry(null);
      setCommandLogs([]);
    }
  }, [t1Data]);

  const handleBoxCommand = () => {
    if (!localTelemetry || !localTelemetry.stints || localTelemetry.stints.length === 0) return;
    
    const lastStint = localTelemetry.stints[localTelemetry.stints.length - 1];
    const lastLap = lastStint.laps[lastStint.laps.length - 1];
    const firstStint = localTelemetry.stints[0];
    const freshLapTime = firstStint.laps[0].lapTimeMs;
    
    const nextStintNum = localTelemetry.stints.length + 1;
    const nextLapNum = lastLap.lap + 1;
    
    const newLap = {
      lap: nextLapNum,
      stintLap: 1,
      lapTimeMs: freshLapTime,
      lapTimeStr: formatMs(freshLapTime),
      rollingStdMs: null,
      predictedMs: freshLapTime,
      anomaly: false
    };
    
    const newStint = {
      stintNumber: nextStintNum,
      lapsCount: 1,
      slope: 75.0,
      consistency: 90.0,
      laps: [newLap]
    };
    
    const telemetryCopy = JSON.parse(JSON.stringify(localTelemetry));
    telemetryCopy.stints.push(newStint);
    telemetryCopy.pitStopsCount = (telemetryCopy.pitStopsCount || 0) + 1;
    
    setLocalTelemetry(telemetryCopy);
    setSelectedStint(nextStintNum.toString());
    
    const timeStr = new Date().toLocaleTimeString();
    const code = drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV';
    
    setCommandLogs(prev => [
      ...prev,
      { id: Date.now() + '-1', time: timeStr, text: `RADIO: TRANSMITTED -> [BOX THIS LAP] TO CAR ${code}`, type: 'warning' },
      { id: Date.now() + '-2', time: timeStr, text: `ACK: CAR ${code} -> "BOXING BOXING BOXING"`, type: 'info' }
    ]);
    
    setTimeout(() => {
      const completionTime = new Date().toLocaleTimeString();
      setCommandLogs(prev => [
        ...prev,
        { id: Date.now() + '-3', time: completionTime, text: `PIT_WALL: STATIONARY TIME: 2.38s // PIT_LANE_DELTA: 22.45s`, type: 'success' },
        { id: Date.now() + '-4', time: completionTime, text: `TELEMETRY: STINT ${nextStintNum} COMMENCED ON FRESH SOFT TIRES.`, type: 'info' }
      ]);
    }, 1200);
  };

  const handlePushCommand = () => {
    if (!localTelemetry) return;
    setActiveCommand('push');
    setEngineMode('Strat 14');
    
    const timeStr = new Date().toLocaleTimeString();
    const code = drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV';
    
    setCommandLogs(prev => [
      ...prev,
      { id: Date.now() + '-1', time: timeStr, text: `RADIO: TRANSMITTED -> [PUSH PACE] TO CAR ${code}`, type: 'warning' },
      { id: Date.now() + '-2', time: timeStr, text: `ACK: CAR ${code} -> "Copy, pushing now. Deploying full energy."`, type: 'info' }
    ]);
  };

  const handleConserveCommand = () => {
    if (!localTelemetry) return;
    setActiveCommand('manage');
    setEngineMode('Strat 1');
    
    const timeStr = new Date().toLocaleTimeString();
    const code = drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV';
    
    setCommandLogs(prev => [
      ...prev,
      { id: Date.now() + '-1', time: timeStr, text: `RADIO: TRANSMITTED -> [CONSERVE TIRES] TO CAR ${code}`, type: 'info' },
      { id: Date.now() + '-2', time: timeStr, text: `ACK: CAR ${code} -> "Copy that, implementing lift and coast."`, type: 'success' }
    ]);
  };

  const handleRechargeCommand = () => {
    if (!localTelemetry) return;
    setActiveCommand('recharge');
    
    const timeStr = new Date().toLocaleTimeString();
    const code = drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV';
    
    setCommandLogs(prev => [
      ...prev,
      { id: Date.now() + '-1', time: timeStr, text: `RADIO: TRANSMITTED -> [BATTERY HARVEST] TO CAR ${code}`, type: 'info' },
      { id: Date.now() + '-2', time: timeStr, text: `ACK: CAR ${code} -> "ERS recovery mode active. Charging hybrid units."`, type: 'success' }
    ]);
  };

  const handleEngineModeChange = (mode) => {
    setEngineMode(mode);
    const timeStr = new Date().toLocaleTimeString();
    const code = drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV';
    setCommandLogs(prev => [
      ...prev,
      { id: Date.now().toString(), time: timeStr, text: `DIAL_ADJUST: CAR ${code} ENGINE MODE SET TO ${mode}`, type: 'info' }
    ]);
  };

  const handleBrakeBalanceChange = (val) => {
    setBrakeBalance(val);
    const timeStr = new Date().toLocaleTimeString();
    const code = drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV';
    setCommandLogs(prev => [
      ...prev,
      { id: Date.now().toString(), time: timeStr, text: `DIAL_ADJUST: CAR ${code} BRAKE BALANCE ADJUSTED TO ${val}%`, type: 'info' }
    ]);
  };

  const handleDiffChange = (val) => {
    setDiffEntry(val);
    const timeStr = new Date().toLocaleTimeString();
    const code = drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV';
    setCommandLogs(prev => [
      ...prev,
      { id: Date.now().toString(), time: timeStr, text: `DIAL_ADJUST: CAR ${code} DIFF ENTRY SET TO ${val}%`, type: 'info' }
    ]);
  };

  // Fetch Tab 2 Strategy Delta
  useEffect(() => {
    if (t2CircuitId && t2LeadDriverId && t2ChaserDriverId && activeTab === 'strategy-room') {
      fetchPitStrategy();
    }
  }, [t2CircuitId, t2LeadDriverId, t2ChaserDriverId, t2Gap, t2TireAge, activeTab]);

  const fetchPitStrategy = async () => {
    try {
      setT2Loading(true);
      const res = await fetch(
        `${API_BASE}/api/pit-strategy?circuitId=${t2CircuitId}&driverId1=${t2LeadDriverId}&driverId2=${t2ChaserDriverId}&currentGap=${t2Gap}&tires1Age=${t2TireAge}`
      );
      if (!res.ok) throw new Error('Strategy details offline.');
      const data = await res.json();
      setT2Data(data);
    } catch (err) {
      console.error(err);
    } finally {
      setT2Loading(false);
    }
  };



  // Helper to format milliseconds to laptime string e.g. 1:32.402
  const formatMs = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(3);
    return minutes > 0 ? `${minutes}:${seconds.padStart(6, '0')}` : `${seconds}s`;
  };

  // Parse charting data for Driver Pace
  const getPaceChartData = () => {
    if (!localTelemetry || !localTelemetry.stints) return [];
    
    let allLaps = [];
    localTelemetry.stints.forEach(stint => {
      if (selectedStint !== 'all' && stint.stintNumber !== parseInt(selectedStint)) {
        return;
      }
      stint.laps.forEach(lap => {
        let lapTimeVal = lap.lapTimeMs;
        let predictedVal = lap.predictedMs;
        
        // Apply active command effects to the current (last) stint's laps
        if (stint.stintNumber === localTelemetry.stints.length) {
          if (activeCommand === 'push') {
            lapTimeVal = lap.lapTimeMs - 800; // 0.8s faster
            predictedVal = lap.predictedMs + (lap.stintLap * 40); // faster wear slope
          } else if (activeCommand === 'manage') {
            lapTimeVal = lap.lapTimeMs + 600; // 0.6s slower
            predictedVal = lap.predictedMs - (lap.stintLap * 35); // flatter wear slope
          } else if (activeCommand === 'recharge') {
            lapTimeVal = lap.lapTimeMs + 1000; // 1.0s slower
          }
          
          // Also adjust by engine mode:
          if (engineMode === 'Strat 14') {
            lapTimeVal -= 400; // additional speed
          } else if (engineMode === 'Strat 10') {
            lapTimeVal -= 200;
          } else if (engineMode === 'Strat 1') {
            lapTimeVal += 500; // slow down
          }
        }
        
        allLaps.push({
          lap: lap.lap,
          stintLap: lap.stintLap,
          stint: stint.stintNumber,
          "Lap Time": parseFloat((lapTimeVal / 1000).toFixed(3)),
          "Degradation Trend": parseFloat((predictedVal / 1000).toFixed(3)),
          "Rolling Std Dev": lap.rollingStdMs ? parseFloat((lap.rollingStdMs / 1000).toFixed(3)) : null,
          isAnomaly: lap.anomaly,
          "AI Predicted Pace": null,
          isFuture: false
        });
      });
    });
    
    allLaps.sort((a, b) => a.lap - b.lap);
    
    // Merge AI predictions if the focus stint is either "all" or the latest stint
    const lastStintNum = localTelemetry.stints.length;
    const isLatestStintFocused = selectedStint === 'all' || parseInt(selectedStint) === lastStintNum;
    
    if (t1AiData && t1AiData.predictions && isLatestStintFocused) {
      t1AiData.predictions.forEach(pred => {
        const existingLap = allLaps.find(l => l.lap === pred.lap);
        if (existingLap) {
          existingLap["AI Predicted Pace"] = parseFloat((pred.predictedMs / 1000).toFixed(3));
        } else if (pred.isFuture) {
          allLaps.push({
            lap: pred.lap,
            stintLap: pred.stintLap,
            stint: lastStintNum,
            "Lap Time": null,
            "Degradation Trend": null,
            "Rolling Std Dev": null,
            isAnomaly: false,
            "AI Predicted Pace": parseFloat((pred.predictedMs / 1000).toFixed(3)),
            isFuture: true
          });
        }
      });
    }
    
    return allLaps.sort((a, b) => a.lap - b.lap);
  };

  // Custom tooltip for pace degradation chart
  const CustomPaceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-md shadow-lg text-xs font-telemetry">
          <p className="text-slate-400 font-bold mb-1">
            LAP {data.lap} {data.isFuture ? '(AI PREDICTION)' : `(STINT ${data.stint})`}
          </p>
          {data["Lap Time"] && (
            <p className="text-cyan-400">Pace: {formatMs(data["Lap Time"] * 1000)}</p>
          )}
          {data["AI Predicted Pace"] && (
            <p className="text-purple-400">AI Model Fit: {formatMs(data["AI Predicted Pace"] * 1000)}</p>
          )}
          {data["Degradation Trend"] && (
            <p className="text-f1-red">Deg. Baseline: {formatMs(data["Degradation Trend"] * 1000)}</p>
          )}
          {data["Rolling Std Dev"] && (
            <p className="text-yellow-400">Consistency (σ): {data["Rolling Std Dev"].toFixed(3)}s</p>
          )}
          {data.isAnomaly && (
            <span className="inline-block mt-2 px-1.5 py-0.5 bg-red-950 border border-red-500 text-red-500 rounded font-bold">
              CRITICAL PACE DROPOUT (ANOMALY)
            </span>
          )}
        </div>
      );
    }
    return null;
  };



  // Selected stint helper objects and stats for local simulation
  const getSelectedStintObj = () => {
    if (!localTelemetry || !localTelemetry.stints || localTelemetry.stints.length === 0) return null;
    if (selectedStint === 'all') {
      return localTelemetry.stints[localTelemetry.stints.length - 1];
    }
    return localTelemetry.stints.find(s => s.stintNumber === parseInt(selectedStint)) || localTelemetry.stints[localTelemetry.stints.length - 1];
  };

  const selectedStintObj = getSelectedStintObj();
  
  // Calculate Tire Health remaining (100% down to 10%, decaying 3% per lap, managed or pushed)
  const getTireHealth = () => {
    if (!selectedStintObj) return 0;
    let baseLaps = selectedStintObj.lapsCount;
    let rate = 2.5;
    if (activeCommand === 'manage') rate = 1.5;
    else if (activeCommand === 'push') rate = 4.0;
    
    return Math.max(Math.round(100 - baseLaps * rate), 10);
  };
  
  const tireHealth = getTireHealth();
  
  // Calculate average stint pace in ms
  const getStintAvgPaceMs = () => {
    if (!selectedStintObj || !selectedStintObj.laps || selectedStintObj.laps.length === 0) return 0;
    const rawTimes = selectedStintObj.laps.map(l => {
      let time = l.lapTimeMs;
      // apply adjustments if active stint
      if (selectedStintObj.stintNumber === localTelemetry.stints.length) {
        if (activeCommand === 'push') time -= 800;
        else if (activeCommand === 'manage') time += 600;
        else if (activeCommand === 'recharge') time += 1000;
        
        if (engineMode === 'Strat 14') time -= 400;
        else if (engineMode === 'Strat 10') time -= 200;
        else if (engineMode === 'Strat 1') time += 500;
      }
      return time;
    });
    return rawTimes.reduce((sum, val) => sum + val, 0) / rawTimes.length;
  };

  const avgPaceMs = getStintAvgPaceMs();

  // Calculate consistency index (0-100) from std dev
  const getConsistencyIndex = () => {
    if (!selectedStintObj) return 0;
    const c = selectedStintObj.consistency;
    let score = Math.max(100 - (c / 15), 35);
    if (activeCommand === 'push') score = Math.max(score - 4, 30);
    return score;
  };

  const consistencyIdx = getConsistencyIndex();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      {/* Pit wall grid overlay */}
      <div className="telemetry-grid-bg"></div>
      
      {/* 1. Header (Floating HUD Canopy) */}
      <nav className="fixed top-3 left-4 right-4 z-50 floating-hud carbon-weave px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 boot-seq">
        <div className="flex items-center gap-6">
          {/* Brand Logo */}
          <div className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-black italic text-primary bg-primary/10 px-4 py-1 skew-x-[-12deg] border-l-4 border-primary flex items-center gap-3">
            <span className="unskew-content tracking-tighter">MERCEDES-AMG // APEXOS</span>
            <div className="w-2 h-2 rounded-full bg-primary pulse-led unskew-content"></div>
          </div>
          
          {/* Global Error Banner */}
          {errorMessage && (
            <div className="px-3 py-1.5 bg-error-container/30 border border-error/20 rounded text-[11px] text-error flex items-center gap-2 animate-pulse max-w-xs font-telemetry">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span className="truncate">{errorMessage}</span>
            </div>
          )}
        </div>
        
        {/* Navigation Links (Segmented Control Style) */}
        <div className="hidden md:flex bg-surface-container p-0.5 rounded skew-x-[-12deg] border border-white/5">
          <button 
            onClick={() => setActiveTab('driver-view')}
            className={`px-6 py-2 font-label-caps text-label-caps tracking-widest unskew-content transition-all ${
              activeTab === 'driver-view'
                ? 'bg-surface-bright/40 neon-border-teal text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface-variant/5'
            }`}
          >
            <span className="skew-x-[12deg] inline-block uppercase">Driver Command</span>
          </button>
          <button 
            onClick={() => setActiveTab('strategy-room')}
            className={`px-6 py-2 font-label-caps text-label-caps tracking-widest unskew-content transition-all ${
              activeTab === 'strategy-room'
                ? 'bg-surface-bright/40 neon-border-teal text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface-variant/5'
            }`}
          >
            <span className="skew-x-[12deg] inline-block uppercase">Strategy Control</span>
          </button>
        </div>

        {/* Trailing Icons */}
        <div className="flex gap-4 items-center relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className={`text-on-surface-variant hover:text-on-surface transition-colors hover:bg-on-surface-variant/5 p-2 rounded-full active:scale-95 transition-transform ${showProfile ? 'text-[#00eefc]' : ''}`}
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>

          {/* Profile Menu Dropdown (Basic) */}
          {showProfile && (
            <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-800 rounded p-3 flex flex-col gap-3 shadow-lg z-[100] text-xs">
              {/* User Info */}
              <div className="pb-2 border-b border-slate-800">
                <p className="font-bold text-slate-200">Peter Bonnington</p>
                <p className="text-[10px] text-slate-500">mercedes_admin</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowProfile(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px] transition-colors cursor-pointer text-center"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 2. Main Workspace Layout */}
      <main className="pt-[140px] md:pt-[100px] pb-20 md:pb-8 px-4 md:px-margin-desktop flex-1 max-w-container-max mx-auto w-full flex flex-col gap-6 z-10">
        
        {loadingMetadata ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={36} className="animate-spin text-f1-red" />
            <p className="text-sm font-telemetry uppercase tracking-widest text-slate-400">Booting Analytics Systems...</p>
          </div>
        ) : (
          <>
            {/* ====================================================================
                TAB 1: DRIVER COMMAND VIEW
               ==================================================================== */}
            {activeTab === 'driver-view' && (
              <div className="flex flex-col gap-6 w-full">
                
                {/* Control Panel Bar */}
                <div className="telemetry-card red-header flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                  <div className="flex items-center gap-3">
                    <Gauge className="text-f1-red" size={20} />
                    <div>
                      <h2 className="font-telemetry font-bold text-sm uppercase text-slate-200">Driver Telemetry Feeds</h2>
                      <p className="text-xs text-slate-500">Track pace degradation curves and stint-by-stint consistency ratings</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Select Athlete</label>
                      <select 
                        value={t1DriverId} 
                        onChange={(e) => setT1DriverId(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs py-1.5 px-3 rounded text-slate-100"
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{d.code} - {d.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Select Circuit</label>
                      <select 
                        value={t1CircuitId} 
                        onChange={(e) => setT1CircuitId(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs py-1.5 px-3 rounded text-slate-100"
                      >
                        {circuits.map(c => (
                          <option key={c.circuitId} value={c.circuitId}>{c.name} ({c.location})</option>
                        ))}
                      </select>
                    </div>

                    {localTelemetry && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Focus Stint</label>
                        <select 
                          value={selectedStint} 
                          onChange={(e) => setSelectedStint(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-xs py-1.5 px-3 rounded text-slate-100"
                        >
                          <option value="all">All Stints</option>
                          {localTelemetry.stints.map(s => (
                            <option key={s.stintNumber} value={s.stintNumber}>Stint {s.stintNumber} ({s.lapsCount} Laps)</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {t1Loading ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-3">
                    <RefreshCw size={28} className="animate-spin text-cyan-400" />
                    <p className="text-xs font-telemetry uppercase tracking-wider text-slate-500">Retrieving lap times & pit history...</p>
                  </div>
                ) : localTelemetry ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Primary Chart Area & Command Panel */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      {/* Stat Cards Grid (Side-by-Side Bento View) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Bento Card 1: Tire Deg Rate */}
                        <div className="telemetry-card red-header flex items-center justify-between interactive-card bg-slate-900/40 border border-primary-container/10">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="led-indicator led-teal"></span>
                              <h3 className="text-[9px] text-slate-400 uppercase font-black tracking-widest font-telemetry">Tire Deg Rate</h3>
                            </div>
                            <div className="font-telemetry text-2xl font-black text-primary tabular-nums tracking-tighter glow-cyan">
                              {selectedStintObj && selectedStintObj.slope > 0 ? '+' : ''}
                              {selectedStintObj 
                                ? ((selectedStintObj.slope + (activeCommand === 'push' && selectedStintObj.stintNumber === localTelemetry.stints.length ? 40 : activeCommand === 'manage' && selectedStintObj.stintNumber === localTelemetry.stints.length ? -35 : 0)) / 1000).toFixed(3)
                                : '0.000'}
                              <span className="text-[10px] text-slate-500 ml-1">s/lap</span>
                            </div>
                          </div>
                          
                          {/* Circular Progress Ring */}
                          <div className="w-14 h-14 relative flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle cx="28" cy="28" fill="none" r="23" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5"></circle>
                              <circle 
                                className="transition-all duration-500 ease-out"
                                cx="28" 
                                cy="28" 
                                fill="none" 
                                r="23" 
                                stroke={tireHealth > 40 ? '#00ff87' : tireHealth > 20 ? '#ffd300' : '#ff1801'} 
                                strokeDasharray="144" 
                                strokeDashoffset={144 - (144 * tireHealth) / 100} 
                                strokeWidth="4"
                                strokeLinecap="round"
                              ></circle>
                            </svg>
                            <span className="font-telemetry text-xs font-black text-slate-100">{tireHealth}%</span>
                          </div>
                        </div>

                        {/* Bento Card 2: Consistency Index */}
                        <div className="telemetry-card cyan-header flex items-center justify-between interactive-card bg-slate-900/40 border border-primary-container/10">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="led-indicator led-green animate-pulse"></span>
                              <h3 className="text-[9px] text-slate-400 uppercase font-black tracking-widest font-telemetry">Consistency</h3>
                            </div>
                            <div className="font-telemetry text-2xl font-black text-cyan-400 tabular-nums tracking-tighter glow-cyan">
                              {selectedStintObj ? consistencyIdx.toFixed(1) : '0.0'}
                              <span className="text-[10px] text-slate-500 ml-1">/100</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center bg-cyan-950/20 border border-cyan-800/30 p-2 rounded-md">
                            <Activity size={20} className="text-cyan-400 heartbeat-glow" />
                            <span className="text-[8px] font-telemetry text-cyan-500 mt-1 uppercase font-bold">STABLE</span>
                          </div>
                        </div>

                        {/* Bento Card 3: Average Pace stint */}
                        <div className="telemetry-card flex items-center justify-between interactive-card bg-slate-900/40 border border-primary-container/10">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="led-indicator led-purple"></span>
                              <h3 className="text-[9px] text-slate-400 uppercase font-black tracking-widest font-telemetry">Avg Pace (Stint)</h3>
                            </div>
                            <div className="font-telemetry text-2xl font-black text-slate-100 tabular-nums tracking-tighter">
                              {avgPaceMs ? formatMs(avgPaceMs) : '0.000'}
                            </div>
                          </div>
                          
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded-md">
                            <Clock size={20} className="text-slate-400" />
                          </div>
                        </div>

                        {/* Bento Card 4: Race Analytics Summary */}
                        <div className="telemetry-card yellow-header flex flex-col justify-between bg-slate-900/40 border border-primary-container/10">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="led-indicator led-yellow animate-pulse"></span>
                            <h3 className="text-[9px] text-slate-400 uppercase font-black tracking-widest font-telemetry">Garage Stats</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-950/60 p-2 border border-slate-900 rounded">
                              <span className="text-[8px] text-slate-500 uppercase font-bold block">Pits</span>
                              <span className="text-sm font-telemetry font-black text-[#00ffec]">{localTelemetry.pitStopsCount}</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 border border-slate-900 rounded">
                              <span className="text-[8px] text-slate-500 uppercase font-bold block">Stints</span>
                              <span className="text-sm font-telemetry font-black text-[#ffd300]">{localTelemetry.stints.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Telemetry Chart */}
                      <div className="telemetry-card cyan-header flex flex-col min-h-[400px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                          <h3 className="font-telemetry font-bold text-sm text-cyan-400 uppercase flex items-center gap-2">
                            <Activity size={16} />
                            Pace Degradation & Tire Wear Telemetry
                          </h3>
                          <div className="flex items-center gap-4">
                            {/* Toggle Switch */}
                            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded text-[10px] font-telemetry">
                              <button
                                onClick={() => setTelemetryMode('historical')}
                                className={`px-2.5 py-1 rounded transition-all uppercase ${
                                  telemetryMode === 'historical' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                Stint History
                              </button>
                              <button
                                onClick={() => setTelemetryMode('live')}
                                className={`px-2.5 py-1 rounded transition-all uppercase ${
                                  telemetryMode === 'live' ? 'bg-f1-red text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                Live Delta Feed
                              </button>
                            </div>
                            
                            {telemetryMode === 'historical' && (
                              <div className="hidden lg:flex items-center gap-4 text-xs font-telemetry">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-400"></span> Actual Pace</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-f1-red"></span> Wear Trend</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-yellow-400"></span> Variance (σ)</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chart Area Toggle */}
                        {telemetryMode === 'live' ? (
                          <div className="flex-grow flex-1 min-h-[350px] border-b border-l border-white/10 relative flex items-end overflow-hidden pb-4">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container/5 rounded-full blur-3xl"></div>
                            
                            {/* Scanner Line Overlay */}
                            <div className="scanner-line"></div>
                            
                            {/* RPM Indicator Bar (Floating Visor Style) */}
                            <div className="absolute top-16 left-4 right-4 z-10 flex flex-col gap-1.5 font-telemetry">
                              <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase font-black tracking-widest">
                                <span>Engine RPM (ICE + MGU-K)</span>
                                <span className="text-[#00ff87]">12,400 RPM</span>
                              </div>
                              <div className="rpm-grid">
                                <span className="rpm-segment active-green"></span>
                                <span className="rpm-segment active-green"></span>
                                <span className="rpm-segment active-green"></span>
                                <span className="rpm-segment active-green"></span>
                                <span className="rpm-segment active-green"></span>
                                <span className="rpm-segment active-yellow"></span>
                                <span className="rpm-segment active-yellow"></span>
                                <span className="rpm-segment active-yellow"></span>
                                <span className="rpm-segment active-red animate-pulse"></span>
                                <span className="rpm-segment active-red animate-pulse"></span>
                              </div>
                            </div>
                            
                            {/* Simulated SVG Graph */}
                            <div className="absolute w-full h-full inset-0 flex items-end px-4 pb-4">
                              <svg className="w-full h-[60%] preserve-aspect-ratio-none" preserveAspectRatio="none" viewBox="0 0 100 50">
                                {/* Grid lines */}
                                <line stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" x1="0" x2="100" y1="10" y2="10"></line>
                                <line stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" x1="0" x2="100" y1="25" y2="25"></line>
                                <line stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" x1="0" x2="100" y1="40" y2="40"></line>
                                {/* Wear Line (Red) */}
                                <path className="drop-shadow-[0_0_5px_rgba(255,24,1,0.4)]" d="M0,45 L20,40 L40,30 L60,25 L80,15 L100,5" fill="none" stroke="#ff1801" strokeWidth="0.8"></path>
                                {/* Pace Line (Petronas Teal) */}
                                <path className="heartbeat-glow" d="M0,35 L10,32 L20,38 L30,28 L40,30 L50,20 L60,25 L70,18 L80,22 L90,12 L100,15" fill="none" stroke="#00ffec" strokeWidth="1.5"></path>
                                <path d="M0,35 L10,32 L20,38 L30,28 L40,30 L50,20 L60,25 L70,18 L80,22 L90,12 L100,15 L100,50 L0,50 Z" fill="url(#cyan-grad)" opacity="0.08"></path>
                                <defs>
                                  <linearGradient id="cyan-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00ffec"></stop>
                                    <stop offset="100%" stopColor="transparent"></stop>
                                  </linearGradient>
                                </defs>
                              </svg>
                              
                              {/* Warning Beacon */}
                              <div className="absolute bottom-[40%] left-[75%] w-2.5 h-2.5 bg-primary-container rounded-full animate-ping"></div>
                              <div className="absolute bottom-[40%] left-[75%] w-2.5 h-2.5 bg-primary-container rounded-full shadow-[0_0_10px_#ff1801]"></div>
                            </div>

                            {/* Center Cockpit HUD overlay (Speed & Gear) */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-950/80 border border-slate-800/60 rounded px-4 py-2 flex items-center gap-4 shadow-lg z-10 font-telemetry select-none">
                              <div className="text-center">
                                <span className="text-[7px] text-slate-500 uppercase block tracking-widest font-black">Gear</span>
                                <span className="text-xl font-black text-cyan-400">G7</span>
                              </div>
                              <div className="h-6 w-[1px] bg-slate-800"></div>
                              <div className="text-center">
                                <span className="text-[7px] text-slate-500 uppercase block tracking-widest font-black">Speed</span>
                                <span className="text-xl font-black text-white">318 <span className="text-[9px] font-normal text-slate-400">KM/H</span></span>
                              </div>
                              <div className="h-6 w-[1px] bg-slate-800"></div>
                              <div className="text-center">
                                <span className="text-[7px] text-slate-500 uppercase block tracking-widest font-black">SOC</span>
                                <span className="text-xl font-black text-[#00ff87]">88%</span>
                              </div>
                            </div>
                            
                            {/* HUD Metadata Overlay */}
                            <div className="absolute top-4 left-4 z-10 flex flex-col font-telemetry">
                              <span className="text-secondary text-[10px] font-black tracking-widest uppercase animate-pulse flex items-center gap-1.5">
                                <span className="led-indicator led-green animate-pulse"></span>
                                TELEMETRY STREAM // MERCEDES AMG
                              </span>
                              <span className="text-[9px] text-slate-500 uppercase font-semibold mt-0.5">
                                Driver Code: {drivers.find(d => d.driverId == t1DriverId)?.code || 'DRV'} // STATUS: NOMINAL
                              </span>
                            </div>

                            <div className="absolute top-4 right-4 z-10 flex gap-2 font-telemetry text-[9px]">
                              <span className="px-2 py-0.5 bg-slate-900/80 border border-slate-800 text-slate-300 rounded font-bold">
                                TYRE: SOFT [S]
                              </span>
                              <span className="px-2 py-0.5 bg-green-950/40 border border-green-500/30 text-[#00ff87] rounded font-bold animate-pulse flex items-center gap-1 shadow-[0_0_8px_rgba(0,255,135,0.2)]">
                                <span className="w-1.5 h-1.5 bg-[#00ff87] rounded-full"></span> DRS
                              </span>
                              <span className="px-2 py-0.5 bg-slate-900/80 border border-primary/20 text-primary rounded font-bold">
                                LAP {selectedStintObj ? (selectedStintObj.laps[selectedStintObj.laps.length - 1]?.lap || 42) : 42}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getPaceChartData()} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2533" />
                                <XAxis 
                                  dataKey="lap" 
                                  stroke="#64748b" 
                                  label={{ value: 'Race Lap', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                                  tick={{ fontSize: 10, fontFamily: 'Orbitron' }}
                                />
                                <YAxis 
                                  domain={['dataMin - 1', 'dataMax + 1']}
                                  stroke="#64748b"
                                  label={{ value: 'Lap Time (Seconds)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 10 }}
                                  tick={{ fontSize: 10, fontFamily: 'Orbitron' }}
                                />
                                <Tooltip content={<CustomPaceTooltip />} />
                                <Legend verticalAlign="top" height={36} className="hidden" />
                                
                                <Line 
                                  type="monotone" 
                                  dataKey="Lap Time" 
                                  stroke="#00f0ff" 
                                  strokeWidth={2}
                                  dot={(props) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.isAnomaly) {
                                      return (
                                        <circle cx={cx} cy={cy} r={5} fill="#e10600" stroke="#fff" strokeWidth={1} />
                                      );
                                    }
                                    return (
                                      <circle cx={cx} cy={cy} r={2} fill="#00f0ff" />
                                    );
                                  }} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="Degradation Trend" 
                                  stroke="#e10600" 
                                  strokeWidth={1.5}
                                  strokeDasharray="4 4"
                                  dot={false}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="Rolling Std Dev" 
                                  stroke="#ffd300" 
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="AI Predicted Pace" 
                                  stroke="#d126ff" 
                                  strokeWidth={2}
                                  strokeDasharray="3 3"
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        <div className="mt-4 text-[10px] text-slate-500 uppercase tracking-wider flex justify-between">
                          <span>Race Session: {localTelemetry.raceName} ({localTelemetry.year})</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-f1-red inline-block"></span> Red Node Indicates Telemetry Anomaly (dropout / SC)</span>
                        </div>
                      </div>

                      {/* Driver Command & Directives Console */}
                      <div className="telemetry-card red-header flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h3 className="font-telemetry font-bold text-sm text-f1-red uppercase flex items-center gap-2">
                            <Sliders size={16} />
                            Driver Directives & Cockpit Control Station
                          </h3>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-semibold">
                            Link Status: <span className="led-indicator led-green"></span> SECURE
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-1">
                          <button 
                            onClick={handleBoxCommand}
                            className="px-4 py-2.5 rounded border border-red-500/40 bg-red-950/20 text-red-400 hover:bg-red-500 hover:text-white font-telemetry text-xs font-bold uppercase transition-all shadow-[0_0_10px_rgba(225,6,0,0.1)] active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle size={14} className="animate-pulse" />
                            BOX THIS LAP
                          </button>
                          <button 
                            onClick={handlePushCommand}
                            className={`px-4 py-2.5 rounded border font-telemetry text-xs font-bold uppercase transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                              activeCommand === 'push' 
                                ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-[0_0_12px_rgba(255,211,0,0.3)]' 
                                : 'border-yellow-500/40 bg-yellow-950/20 text-yellow-400 hover:bg-yellow-500 hover:text-slate-950'
                            }`}
                          >
                            <Zap size={14} />
                            PUSH PACE
                          </button>
                          <button 
                            onClick={handleConserveCommand}
                            className={`px-4 py-2.5 rounded border font-telemetry text-xs font-bold uppercase transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                              activeCommand === 'manage'
                                ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                                : 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950'
                            }`}
                          >
                            <Activity size={14} />
                            CONSERVE TIRES
                          </button>
                          <button 
                            onClick={handleRechargeCommand}
                            className={`px-4 py-2.5 rounded border font-telemetry text-xs font-bold uppercase transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                              activeCommand === 'recharge'
                                ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_12px_rgba(209,38,255,0.3)]'
                                : 'border-purple-500/40 bg-purple-950/20 text-purple-400 hover:bg-purple-500 hover:text-white'
                            }`}
                          >
                            <RefreshCw size={14} />
                            ERS RECHARGE
                          </button>
                        </div>

                        {/* Dial switches */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-900 pt-3">
                          {/* Engine Mode */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-500 uppercase font-semibold">Engine Mapping</label>
                            <div className="grid grid-cols-4 rounded overflow-hidden border border-slate-800 p-0.5 bg-slate-950">
                              {['Strat 1', 'Strat 7', 'Strat 10', 'Strat 14'].map((mode) => (
                                <button
                                  key={mode}
                                  onClick={() => handleEngineModeChange(mode)}
                                  className={`py-1 text-[9px] font-telemetry uppercase tracking-wider transition-all ${
                                    engineMode === mode 
                                      ? 'bg-f1-red text-white shadow-md' 
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {mode.split(' ')[1]}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Brake Balance Dial */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[10px] uppercase font-semibold">
                              <span className="text-slate-500">Brake Balance</span>
                              <span className="font-telemetry text-cyan-400">{brakeBalance.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="range"
                                min="55.0"
                                max="65.0"
                                step="0.5"
                                value={brakeBalance}
                                onChange={(e) => handleBrakeBalanceChange(parseFloat(e.target.value))}
                                className="flex-1 cursor-pointer accent-cyan-400"
                              />
                            </div>
                          </div>

                          {/* Diff Entry Dial */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[10px] uppercase font-semibold">
                              <span className="text-slate-500">Diff Entry</span>
                              <span className="font-telemetry text-yellow-400">{diffEntry}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="range"
                                min="50"
                                max="80"
                                step="2"
                                value={diffEntry}
                                onChange={(e) => handleDiffChange(parseInt(e.target.value))}
                                className="flex-1 cursor-pointer accent-yellow-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Scrolling radio logs terminal */}
                        <div className="border border-slate-900 bg-slate-950/80 rounded-md p-3 font-telemetry text-[11px] relative min-h-[120px] max-h-[160px] flex flex-col justify-between overflow-hidden">
                          <div className="scanner-line"></div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2 flex justify-between">
                            <span>Engineer-to-Driver Radio Link (Direct Feed)</span>
                            <span className="animate-pulse text-f1-red">● LIVE REC</span>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto terminal-logs flex flex-col gap-1 pr-1.5">
                            {commandLogs.map((log) => (
                              <div key={log.id} className="flex gap-2 leading-relaxed">
                                <span className="text-slate-600">[{log.time}]</span>
                                <span className={
                                  log.type === 'success' ? 'text-green-400' :
                                  log.type === 'warning' ? 'text-f1-red' :
                                  log.type === 'error' ? 'text-yellow-400' : 'text-slate-300'
                                }>
                                  {log.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stint Metrics & Ported Stat Cards */}
                    <div className="flex flex-col gap-6">
                      {/* AI Predictive Engine Card */}
                      {t1AiData && !t1AiLoading && (
                        <div className="telemetry-card purple-header flex flex-col gap-4 bg-slate-950/60 border border-purple-500/20 shadow-[0_0_20px_rgba(209,38,255,0.1)]">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                            <h4 className="font-telemetry font-bold text-xs uppercase text-purple-400 flex items-center gap-1.5">
                              <svg className="w-4.5 h-4.5 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              APEX // COGNITIVE STRATEGY SYSTEM
                            </h4>
                            <span className="text-[9px] bg-purple-950/60 border border-purple-500/30 text-purple-400 font-bold px-2 py-0.5 rounded font-telemetry">
                              ACCURACY: {t1AiData.r2Score}%
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-center my-1">
                            <div className="bg-slate-900/60 p-3 border border-slate-900 rounded">
                              <span className="text-[10px] text-slate-500 uppercase font-semibold">Tire Cliff Predicted</span>
                              <p className="text-xl font-telemetry font-black text-f1-red animate-pulse mt-0.5">
                                Lap {t1AiData.tireCliffLap}
                              </p>
                            </div>
                            <div className="bg-slate-900/60 p-3 border border-slate-900 rounded">
                              <span className="text-[10px] text-slate-500 uppercase font-semibold">Optimum Pit Stop</span>
                              <p className="text-sm font-telemetry font-bold text-cyan-400 mt-1.5">
                                Laps {t1AiData.pitWindowStart}-{t1AiData.pitWindowEnd}
                              </p>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-300 bg-slate-900/40 border border-slate-900 p-2.5 rounded leading-relaxed font-telemetry">
                            <p className="text-purple-400 font-bold mb-1 uppercase text-[9px] tracking-wider flex items-center gap-1">
                              <span className="led-indicator led-purple animate-ping"></span>
                              AI Directive Recommendation
                            </p>
                            {t1AiData.recommendation}
                          </div>
                        </div>
                      )}

                      {/* F1 Circuit Map and Track Visualizer */}
                      <CircuitVisualizer 
                        circuitId={parseInt(t1CircuitId)} 
                        circuitName={circuits.find(c => c.circuitId == t1CircuitId)?.name} 
                      />

                      {/* Stint-by-Stint Degradation Speeds */}
                      <div className="telemetry-card flex-1 flex flex-col gap-3">
                        <h4 className="font-telemetry font-bold text-xs uppercase text-slate-200 flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-f1-red" />
                          Tire Degradation Coefficients
                        </h4>
                        <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 flex flex-col gap-2">
                          {localTelemetry.stints.map((stint) => (
                            <div 
                              key={stint.stintNumber}
                              onClick={() => setSelectedStint(stint.stintNumber.toString())}
                              className={`p-3 border rounded text-xs cursor-pointer transition-all flex justify-between items-center ${
                                selectedStint === stint.stintNumber.toString() 
                                  ? 'bg-slate-900 border-cyan-800' 
                                  : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                              }`}
                            >
                              <div>
                                <span className="font-telemetry font-bold text-slate-200">STINT {stint.stintNumber}</span>
                                <p className="text-[10px] text-slate-500 uppercase">{stint.lapsCount} Laps Completed</p>
                              </div>
                              <div className="text-right font-telemetry">
                                <span className={`font-bold block ${stint.slope > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {stint.slope > 0 ? '+' : ''}
                                  {(stint.slope + (activeCommand === 'push' && stint.stintNumber === localTelemetry.stints.length ? 40 : activeCommand === 'manage' && stint.stintNumber === localTelemetry.stints.length ? -35 : 0)).toFixed(1)} ms/lap
                                </span>
                                <span className="text-[9px] text-slate-400">σ: {(stint.consistency / 1000).toFixed(3)}s</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="telemetry-card p-12 text-center text-slate-500 font-telemetry uppercase text-xs">
                    Select a driver and circuit combination to load telemetry curves.
                  </div>
                )}
              </div>
            )}

            {/* ====================================================================
                TAB 2: STRATEGY CONTROL ROOM (Redesigned)
               ==================================================================== */}
            {activeTab === 'strategy-room' && (
              <div className="flex flex-col gap-6 w-full font-sans">
                
                {/* Control Panel (Visor Canopy design) */}
                <div className="telemetry-card flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center rounded-sm bg-[#0e131f]/75 border border-white/10 relative">
                  {/* Subtle 10% Cyan overlay header tint */}
                  <div className="absolute inset-0 bg-[#00eefc]/5 pointer-events-none rounded-sm"></div>
                  
                  <div className="flex items-center gap-3 z-10">
                    <div className="p-2 bg-[#00eefc]/10 border border-[#00eefc]/30 rounded-sm">
                      <Clock className="text-[#00eefc]" size={20} />
                    </div>
                    <div>
                      <h2 className="font-telemetry font-black text-sm uppercase text-slate-100 tracking-wider">APEX // STRATEGY CONTROL ROOM</h2>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Evaluate pit lane deltas & undercut probabilities</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 z-10">
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-slate-500 uppercase font-black tracking-widest font-telemetry">Circuit Location</label>
                      <select 
                        value={t2CircuitId} 
                        onChange={(e) => setT2CircuitId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-xs py-1.5 px-3 rounded-sm text-slate-100 font-telemetry outline-none focus:border-[#00eefc]/50"
                      >
                        {circuits.map(c => (
                          <option key={c.circuitId} value={c.circuitId}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-slate-500 uppercase font-black tracking-widest font-telemetry">Lead Athlete (Car 1)</label>
                      <select 
                        value={t2LeadDriverId} 
                        onChange={(e) => setT2LeadDriverId(e.target.value)}
                        className="bg-slate-955 border border-slate-800 text-xs py-1.5 px-3 rounded-sm text-slate-100 font-telemetry outline-none focus:border-[#ff553d]/50"
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{d.code} - {d.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-slate-500 uppercase font-black tracking-widest font-telemetry">Chaser Athlete (Car 2)</label>
                      <select 
                        value={t2ChaserDriverId} 
                        onChange={(e) => setT2ChaserDriverId(e.target.value)}
                        className="bg-slate-955 border border-slate-800 text-xs py-1.5 px-3 rounded-sm text-slate-100 font-telemetry outline-none focus:border-[#00eefc]/50"
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{d.code} - {d.fullName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {t2Loading ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-3">
                    <RefreshCw size={28} className="animate-spin text-[#00eefc]" />
                    <p className="text-[10px] font-telemetry uppercase tracking-widest text-slate-500">Calculating pit lane histories...</p>
                  </div>
                ) : t2Data ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Undercut Calculator Workstation */}
                    <div className="lg:col-span-2 telemetry-card flex flex-col gap-6 rounded-sm bg-[#0e131f]/75 border border-white/10 relative">
                      <div className="absolute inset-0 bg-[#ff553d]/5 pointer-events-none rounded-sm"></div>
                      
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 z-10">
                        <h3 className="font-telemetry font-bold text-xs uppercase text-slate-100 flex items-center gap-2">
                          <Sliders size={16} className="text-[#ff553d]" />
                          Dynamic Strategy Simulator / Calculator
                        </h3>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest">REAL-TIME TELEMETRY SIMULATOR</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-2 z-10">
                        {/* Slider 1: Gap */}
                        <div className="bg-slate-900/60 p-4 border border-white/5 rounded-sm flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest font-telemetry">Interval Gap (Car 1 to Car 2)</span>
                            <span className="font-telemetry text-sm font-black text-[#00eefc] glow-cyan">{t2Gap.toFixed(2)}s</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.1" 
                            max="4.0" 
                            step="0.05"
                            value={t2Gap} 
                            onChange={(e) => setT2Gap(parseFloat(e.target.value))}
                            className="w-full cursor-pointer accent-[#ff553d]"
                          />
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Time distance between lead and chasing car in seconds.</span>
                        </div>

                        {/* Slider 2: Tire Age */}
                        <div className="bg-slate-900/60 p-4 border border-white/5 rounded-sm flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest font-telemetry">Car 1 Tire Stint Age</span>
                            <span className="font-telemetry text-sm font-black text-[#ffba20]">{t2TireAge} Laps</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="30" 
                            step="1"
                            value={t2TireAge} 
                            onChange={(e) => setT2TireAge(parseInt(e.target.value))}
                            className="w-full cursor-pointer accent-[#ffba20]"
                          />
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Current number of laps the lead car has driven on this tire set.</span>
                        </div>
                      </div>

                      {/* Simulation visual display */}
                      <div className="mt-2 bg-slate-950 p-4 border border-white/5 rounded-sm font-telemetry text-xs relative overflow-hidden min-h-[140px] z-10 flex flex-col justify-between">
                        <div className="scanner-line"></div>
                        <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase tracking-widest font-black">
                          <span>Pit Stop Simulation Matrix</span>
                          <span className="animate-pulse text-[#ff553d]">● SIM ACTIVE</span>
                        </div>
                        
                        {/* Live track visual runway */}
                        <div className="my-3 relative w-full h-12 bg-slate-900/40 border border-white/5 rounded-sm overflow-hidden flex items-center px-4">
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_100%]"></div>
                          {/* Pit Lane Entry Line */}
                          <div className="absolute left-[40%] h-full w-[1px] bg-red-500/40 border-dashed border-l"></div>
                          <span className="absolute left-[42%] top-1 text-[7px] font-mono text-red-400 font-black">PIT ENTRY</span>
                          
                          {/* Car 1 (Lead) */}
                          <div 
                            className="absolute transition-all duration-300 ease-out flex items-center gap-1.5"
                            style={{ left: `${Math.min(85, 45 + (t2Gap * 10))}%` }}
                          >
                            <span className="text-[9px] font-mono font-black bg-[#ff553d] text-slate-950 px-1.5 py-0.5 rounded-sm shadow-[0_0_8px_rgba(255,85,61,0.4)]">
                              {drivers.find(d => d.driverId == t2LeadDriverId)?.code || 'LEAD'}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff553d] animate-ping"></span>
                          </div>

                          {/* Car 2 (Chaser) */}
                          <div 
                            className="absolute transition-all duration-300 ease-out flex items-center gap-1.5"
                            style={{ left: `${Math.min(85, 45 - (t2Gap * 10))}%` }}
                          >
                            <span className="text-[9px] font-mono font-black bg-[#00eefc] text-slate-950 px-1.5 py-0.5 rounded-sm shadow-[0_0_8px_rgba(0,238,252,0.4)]">
                              {drivers.find(d => d.driverId == t2ChaserDriverId)?.code || 'CHASE'}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00eefc] animate-ping"></span>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <span className="led-indicator led-red"></span>
                            <span>Tire Deg Rate: <strong className="text-white">{(t2Data.tireDegRate * 1000).toFixed(0)} ms/lap</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="led-indicator led-green"></span>
                            <span>Fresh Grip Advantage: <strong className="text-[#00ff87]">+{(t2Data.estimatedOutLapGain).toFixed(2)}s</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scorecard Results */}
                    <div className="flex flex-col gap-6">
                      {/* Probability Score */}
                      <div className="telemetry-card flex flex-col justify-center items-center p-6 gap-3 rounded-sm bg-[#0e131f]/75 border border-white/10 relative">
                        <div className="absolute inset-0 bg-[#ffba20]/5 pointer-events-none rounded-sm"></div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black font-telemetry z-10">Undercut Success Probability</span>
                        
                        {/* Circular Progress Indicator */}
                        <div className="w-24 h-24 relative flex items-center justify-center my-1 z-10">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="48" cy="48" fill="none" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="5"></circle>
                            <circle 
                              className="transition-all duration-500 ease-out"
                              cx="48" 
                              cy="48" 
                              fill="none" 
                              r="42" 
                              stroke={t2Data.undercutProbability >= 80 ? '#00ff87' : t2Data.undercutProbability >= 50 ? '#ffba20' : '#ff553d'} 
                              strokeDasharray="264" 
                              strokeDashoffset={264 - (264 * t2Data.undercutProbability) / 100} 
                              strokeWidth="6"
                              strokeLinecap="round"
                            ></circle>
                          </svg>
                          <div className="font-telemetry font-black text-2xl italic text-white glow-cyan">
                            {t2Data.undercutProbability}%
                          </div>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-sm text-[10px] font-black font-telemetry uppercase tracking-wider z-10 ${
                          t2Data.undercutProbability >= 80 
                            ? 'bg-[#00ff87]/20 border border-[#00ff87]/30 text-[#00ff87]' 
                            : t2Data.undercutProbability >= 50 
                            ? 'bg-[#ffba20]/20 border border-[#ffba20]/30 text-[#ffba20]' 
                            : 'bg-[#ff553d]/20 border border-[#ff553d]/30 text-[#ff553d]'
                        }`}>
                          {t2Data.undercutProbability >= 80 ? 'Optimal Window' : t2Data.undercutProbability >= 50 ? 'High Risk' : 'Closed Window'}
                        </div>
                      </div>

                      {/* Stat Metrics */}
                      <div className="telemetry-card flex-1 flex flex-col gap-4 rounded-sm bg-[#0e131f]/75 border border-white/10 relative">
                        <div className="absolute inset-0 bg-[#00eefc]/5 pointer-events-none rounded-sm"></div>
                        <h4 className="font-telemetry font-bold text-xs uppercase text-slate-100 z-10">Circuit Pit Lane Telemetry</h4>
                        
                        <div className="flex flex-col gap-3 z-10 font-telemetry">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] text-slate-400 uppercase font-black">Avg Pit Lane Delta</span>
                            <span className="text-sm font-black text-slate-100">{t2Data.avgPitDuration.toFixed(2)}s</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] text-slate-400 uppercase font-black">Pit Variance (σ)</span>
                            <span className="text-sm font-black text-slate-400">± {t2Data.pitStopStd.toFixed(2)}s</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] text-slate-400 uppercase font-black">Estimated Undercut Margin</span>
                            <span className={`text-sm font-black ${t2Data.margin > 0 ? 'text-[#00ff87]' : 'text-[#ff553d]'}`}>
                              {t2Data.margin > 0 ? '+' : ''}{t2Data.margin.toFixed(2)}s
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-300 bg-slate-950/60 p-3 border border-white/5 rounded-sm leading-relaxed z-10 font-telemetry">
                          <p className="font-bold text-[#ffba20] mb-1 uppercase text-[9px] tracking-wider flex items-center gap-1.5">
                            <span className="led-indicator led-teal animate-pulse"></span>
                            RACE ENGINEER DIRECTIVE
                          </p>
                          {t2Data.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="telemetry-card p-12 text-center text-slate-500 font-telemetry uppercase text-xs rounded-sm">
                    Select your circuit and drivers to load pit lane calculations.
                  </div>
                )}
              </div>
              )}
          </>
        )}
      </main>
      
      {/* SideNavBar (Mobile Only Bottom Tab Bar) */}
      <div className="md:hidden fixed bottom-0 w-full bg-surface-container-low/95 backdrop-blur-xl border-t border-white/5 z-50 py-3 px-8 flex justify-between items-center boot-seq delay-1">
        <button 
          onClick={() => setActiveTab('driver-view')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'driver-view' ? 'text-primary scale-105 font-bold' : 'text-on-surface-variant'
          }`}
        >
          <Activity size={20} />
          <span className="font-label-caps text-[9px] uppercase tracking-wider">Command</span>
        </button>
        <button 
          onClick={() => setActiveTab('strategy-room')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'strategy-room' ? 'text-primary scale-105 font-bold' : 'text-on-surface-variant'
          }`}
        >
          <Sliders size={20} />
          <span className="font-label-caps text-[9px] uppercase tracking-wider">Strategy</span>
        </button>
      </div>

      {/* 3. Footer Status Bar */}
      <footer className="border-t border-slate-950 bg-slate-950 px-6 py-3 flex justify-between items-center text-[10px] text-slate-500 font-telemetry z-10 pb-16 md:pb-3">
        <span>STATUS: SYSTEM ONLINE</span>
        <span>SYS_LATENCY: 0.14ms // CORE: SQLITE_IN_MEM</span>
        <span>COPYRIGHT © {new Date().getFullYear()} APEXOS INC. ALL RIGHTS RESERVED</span>
      </footer>
    </div>
  );
}
