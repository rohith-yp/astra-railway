import React, { useState, useEffect } from 'react';
import { 
  Shield, Cpu, Clock, RotateCcw, AlertTriangle, CheckCircle2, Loader2, Compass, Sun, Moon, 
  Sparkles, Terminal, LayoutDashboard, Map, Users, AlertCircle, FileText, Settings, Database, 
  CloudSun, Play, Search, ShieldCheck, Train, Copy 
} from 'lucide-react';
import LiveMap from './components/LiveMap';
import DashboardStats from './components/DashboardStats';
import AgentFeed from './components/AgentFeed';
import ControlPanel from './components/ControlPanel';
import AgentTerminal from './components/AgentTerminal';

export default function App() {
  // Config & Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [systemTime, setSystemTime] = useState('');

  // Core railway data state
  const [stats, setStats] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  
  // Active emergency responses state (SQLite database connection)
  const [emergencyResponses, setEmergencyResponses] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  // Search filter states for list views
  const [trainsSearch, setTrainsSearch] = useState('');
  const [stationsSearch, setStationsSearch] = useState('');
  
  // Incidents Tab Search & Filters
  const [incidentsSearch, setIncidentsSearch] = useState('');
  const [incidentsFilterStatus, setIncidentsFilterStatus] = useState('All');
  const [incidentsFilterSeverity, setIncidentsFilterSeverity] = useState('All');

  // Reports Generator tab state
  const [selectedReportType, setSelectedReportType] = useState('incident-registry');
  const [selectedReportTime, setSelectedReportTime] = useState('7d');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);

  // Sidebar navigation control
  const [activeTab, setActiveTab] = useState('dashboard');

  // Simulation & Custom Sandbox state
  const [selectedScenario, setSelectedScenario] = useState('A-42-fracture');
  const [customCrisis, setCustomCrisis] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autopilotResult, setAutopilotResult] = useState<any>(null);
  const [stepData, setStepData] = useState<Record<number, any>>({});
  
  // Stores monologue responses of the agents
  const [agentStates, setAgentStates] = useState<Record<string, any>>({
    TrackHealthAgent: null,
    RiskPredictionAgent: null,
    TrainOperationsAgent: null,
    EmergencyResponseAgent: null,
    PassengerCommunicationAgent: null,
    CrowdIntelligenceAgent: null,
  });
  
  // Console logs stream
  const [feedEvents, setFeedEvents] = useState<any[]>([]);

  // Telemetry clock tick
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      // Format to match May 26, 2025  09:31:52 AM
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSystemTime(`${dateStr}   ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme switcher effect
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Fetch initial datasets
  const loadSystemData = async () => {
    try {
      const [healthRes, statsRes, stationsRes, trainsRes, tracksRes, scenariosRes, incidentsRes, responsesRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/data/stats'),
        fetch('/api/data/stations'),
        fetch('/api/data/trains'),
        fetch('/api/data/track-sections'),
        fetch('/api/simulation/scenarios'),
        fetch('/api/data/incidents?limit=100'),
        fetch('/api/data/emergency-responses')
      ]);

      if (healthRes.ok) setApiStatus(await healthRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (stationsRes.ok) setStations(await stationsRes.json());
      if (trainsRes.ok) setTrains(await trainsRes.json());
      if (tracksRes.ok) setTracks(await tracksRes.json());
      if (scenariosRes.ok) setScenarios(await scenariosRes.json());
      if (incidentsRes.ok) {
        const incData = await incidentsRes.json();
        setIncidents(incData);
        // Default select the first incident in detailed list if none selected
        if (incData.length > 0) {
          setSelectedIncident(incData[0]);
        }
      }
      if (responsesRes.ok) setEmergencyResponses(await responsesRes.json());
    } catch (err) {
      console.error('Error fetching system parameters', err);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, []);

  // Run a single simulation step (Manual flow)
  const handleRunStep = async (stepNum: number) => {
    setLoading(true);
    setAutopilotResult(null); // Clear autopilot pane
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_type: selectedScenario,
          step: stepNum
        })
      });

      if (!response.ok) {
        throw new Error('Simulation step failed');
      }

      const data = await response.json();
      const timestamp = new Date().toLocaleTimeString();

      // Update Agent monologue panel
      setAgentStates(prev => ({
        ...prev,
        [data.agent]: data.data
      }));

      // Append Event logs
      setFeedEvents(prev => [
        ...prev,
        {
          time: timestamp,
          agent: data.agent,
          type: stepNum === 6 ? 'success' : 'alert',
          message: data.message
        },
        {
          time: timestamp,
          agent: data.agent,
          type: 'info',
          message: `Decision: ${data.data.decision}`
        },
        {
          time: timestamp,
          agent: 'Database',
          type: 'info',
          message: `SQL WRITE: ${data.db_changes}`
        }
      ]);

      // Store step response data for ControlPanel display
      setStepData(prev => ({ ...prev, [stepNum]: data }));
      setActiveStep(stepNum);

      // Reload database stats to update LiveMap and stats widgets
      const statsRes = await fetch('/api/data/stats');
      if (statsRes.ok) setStats(await statsRes.json());
      const tracksRes = await fetch('/api/data/track-sections');
      if (tracksRes.ok) setTracks(await tracksRes.json());
      const incidentsRes = await fetch('/api/data/incidents?limit=100');
      if (incidentsRes.ok) {
        const incData = await incidentsRes.json();
        setIncidents(incData);
        if (selectedIncident) {
          const updated = incData.find((i: any) => i.incident_id === selectedIncident.incident_id);
          if (updated) setSelectedIncident(updated);
        } else if (incData.length > 0) {
          setSelectedIncident(incData[0]);
        }
      }
      const responsesRes = await fetch('/api/data/emergency-responses');
      if (responsesRes.ok) setEmergencyResponses(await responsesRes.json());
    } catch (err) {
      console.error(err);
      setFeedEvents(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          agent: 'System',
          type: 'warning',
          message: 'Error executing agent simulation step.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Run Dual-Model AI Autopilot combination (Unique feature)
  const handleAutopilotResolve = async () => {
    if (selectedScenario === 'custom' && !customCrisis.trim()) {
      alert("Please enter a custom railway incident description first.");
      return;
    }
    
    setLoading(true);
    setAutopilotResult(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_type: selectedScenario,
          custom_description: selectedScenario === 'custom' ? customCrisis : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Autopilot resolution failed');
      }

      const data = await response.json();
      setAutopilotResult(data);
      const timestamp = new Date().toLocaleTimeString();

      // Log events
      setFeedEvents(prev => [
        ...prev,
        {
          time: timestamp,
          agent: 'Autopilot',
          type: 'success',
          message: `Dual-LLM resolution engaged on ${data.location}.`
        },
        {
          time: timestamp,
          agent: 'Groq',
          type: 'alert',
          message: `Safety Override: ${data.groq_analysis.action}`
        },
        {
          time: timestamp,
          agent: 'Mistral',
          type: 'info',
          message: `Logistics Dispatch: ${data.mistral_analysis.action}`
        },
        {
          time: timestamp,
          agent: 'Database',
          type: 'success',
          message: `SQL TRANSACTION COMMIT: ${data.db_changes}`
        }
      ]);

      // Populating agent tabs states with unified response
      setAgentStates({
        TrackHealthAgent: {
          thought: "Scanning sensor variables for custom scenario. Identified system level caution warnings.",
          analysis: data.defect_type,
          decision: "Flag custom threat boundary in SQLite database registry.",
          communication: "Alerting safety governor matrix.",
          coordination: "Initiating emergency diagnostic scans.",
          action: "Defect flagged in database logs."
        },
        RiskPredictionAgent: {
          thought: "Evaluating custom threat vectors.",
          analysis: "Analyzed telemetry parameters.",
          decision: "Escalate caution indicators.",
          communication: "Broadcasting warning tags.",
          coordination: "Coordinating safety overrides with operations.",
          action: "Threat matrix logged."
        },
        TrainOperationsAgent: {
          thought: data.groq_analysis.thought,
          analysis: "Engine throttle safety overrides required.",
          decision: "Enforce velocity limits on approach lines.",
          communication: "Transmitting emergency cabin commands.",
          coordination: "Coordinating delays with passenger communication agents.",
          action: data.groq_analysis.action
        },
        EmergencyResponseAgent: {
          thought: data.mistral_analysis.thought,
          analysis: "Allocating emergency crews.",
          decision: "Stage response team to coordinate site clearing.",
          communication: "Crew mobilization orders dispatched.",
          coordination: "Perform repair updates on arrival.",
          action: data.mistral_analysis.action
        },
        PassengerCommunicationAgent: {
          thought: "Timetable modifications necessary.",
          analysis: "Estimating cascading delays.",
          decision: "Broadcast safety alerts to platforms.",
          communication: "Pushed SMS alerts and digital board announcements.",
          coordination: "Divert platform passenger queues.",
          action: "Modified station arrivals display."
        },
        CrowdIntelligenceAgent: {
          thought: "Reviewing platform crowd densities.",
          analysis: "Passenger flow indicators nominal.",
          decision: "Restrict terminal access points.",
          communication: "Broadcast updates.",
          coordination: "Stage support marshals.",
          action: "Platform flow cleared."
        }
      });

      setActiveStep(6); // Automatically completes simulation

      // Reload databases
      const statsRes = await fetch('/api/data/stats');
      if (statsRes.ok) setStats(await statsRes.json());
      const tracksRes = await fetch('/api/data/track-sections');
      if (tracksRes.ok) setTracks(await tracksRes.json());
      const incidentsRes = await fetch('/api/data/incidents?limit=100');
      if (incidentsRes.ok) {
        const incData = await incidentsRes.json();
        setIncidents(incData);
        if (selectedIncident) {
          const updated = incData.find((i: any) => i.incident_id === selectedIncident.incident_id);
          if (updated) setSelectedIncident(updated);
        } else if (incData.length > 0) {
          setSelectedIncident(incData[0]);
        }
      }
      const responsesRes = await fetch('/api/data/emergency-responses');
      if (responsesRes.ok) setEmergencyResponses(await responsesRes.json());

    } catch (err) {
      console.error(err);
      setFeedEvents(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          agent: 'System',
          type: 'warning',
          message: 'Dual-LLM Autopilot encountered execution exception.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Reset current scenario
  const handleReset = async () => {
    setActiveStep(0);
    setAutopilotResult(null);
    setCustomCrisis('');
    setStepData({});
    setAgentStates({
      TrackHealthAgent: null,
      RiskPredictionAgent: null,
      TrainOperationsAgent: null,
      EmergencyResponseAgent: null,
      PassengerCommunicationAgent: null,
      CrowdIntelligenceAgent: null,
    });
    setFeedEvents([]);
    await loadSystemData();
  };

  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      let reportData: any = {};
      const generatedAt = new Date().toLocaleString();
      const reportId = 'REP-' + Math.floor(100000 + Math.random() * 900000);

      if (selectedReportType === 'incident-registry') {
        const total = incidents.length;
        const active = incidents.filter(i => i.status === 'Active').length;
        const resolved = incidents.filter(i => i.status === 'Resolved' || i.status === 'Prevented').length;
        const critical = incidents.filter(i => i.severity.toLowerCase() === 'critical').length;
        
        reportData = {
          id: reportId,
          title: "Incident Registry & AI Resolutions Analysis",
          type: "INCIDENT_REGISTRY_AUDIT",
          generatedAt,
          timeframe: selectedReportTime === '24h' ? 'Last 24 Hours' : (selectedReportTime === '7d' ? 'Last 7 Days' : 'Last 30 Days'),
          summary: {
            "Total Logged Incidents": total,
            "Active Threats": active,
            "Resolved / Prevented": resolved,
            "Critical Threats": critical
          },
          details: incidents.map(i => ({
            id: i.incident_id,
            type: i.incident_type.toUpperCase(),
            location: i.location.split("(")[0],
            severity: i.severity.toUpperCase(),
            status: i.status.toUpperCase(),
            timestamp: i.timestamp
          }))
        };
      } else if (selectedReportType === 'track-health') {
        const avgHealth = stats?.health_index || 94.8;
        const poorSections = tracks.filter(t => t.health_score < 85);
        
        reportData = {
          id: reportId,
          title: "Infrastructure Track Health & Maintenance Audit",
          type: "TRACK_HEALTH_AUDIT",
          generatedAt,
          timeframe: selectedReportTime === '24h' ? 'Last 24 Hours' : (selectedReportTime === '7d' ? 'Last 7 Days' : 'Last 30 Days'),
          summary: {
            "System Average Health Index": `${avgHealth}%`,
            "Monitored Track Sections": tracks.length,
            "Sections Below 85% Health": poorSections.length,
            "Status Indicator": avgHealth > 90 ? "NOMINAL" : "ATTENTION_REQUIRED"
          },
          details: poorSections.map(s => ({
            section: s.section_id,
            location: s.location,
            health: `${s.health_score}%`,
            status: s.maintenance_status.toUpperCase(),
            action: s.health_score < 60 ? "CRITICAL: Urgent replacement needed" : "PRECAUTIONARY: Grind and weld joint"
          }))
        };
      } else {
        const totalDispatches = emergencyResponses.length;
        const resolvedDispatches = emergencyResponses.filter(r => r.resolution_status === 'Resolved').length;
        const avgResp = totalDispatches > 0 
          ? (emergencyResponses.reduce((acc, curr) => acc + curr.response_time, 0) / totalDispatches).toFixed(1)
          : "18.5";
        
        reportData = {
          id: reportId,
          title: "Emergency Response & Logistics Performance",
          type: "EMERGENCY_LOGISTICS_AUDIT",
          generatedAt,
          timeframe: selectedReportTime === '24h' ? 'Last 24 Hours' : (selectedReportTime === '7d' ? 'Last 7 Days' : 'Last 30 Days'),
          summary: {
            "Total Mobilizations": totalDispatches,
            "Fully Resolved Incidents": resolvedDispatches,
            "Average Response Time": `${avgResp} minutes`,
            "Fleet Status": "STANDBY / ACTIVE"
          },
          details: emergencyResponses.map(r => ({
            incident: r.incident_id,
            team: r.team_assigned,
            responseTime: `${r.response_time}m`,
            status: r.resolution_status.toUpperCase()
          }))
        };
      }
      setGeneratedReport(reportData);
      setIsGeneratingReport(false);
    }, 750);
  };

  // Compile scenarios list including the new Custom Sandbox option
  const allScenarios = [
    ...scenarios,
    { id: 'custom', name: 'Custom Sandbox Incident', severity: 'VARIABLE', description: 'Input custom railway emergency details in the input box below. Groq and Mistral will analyze and resolve the crisis in combination.' }
  ];

  const currentScenarioInfo = allScenarios.find(s => s.id === selectedScenario);

  const timelineSteps = [
    { num: 1, name: "Track Health Agent", cat: "TRACK HEALTH", time: "09:31:44 AM", desc: "Anomaly detected on Track A-42" },
    { num: 2, name: "Risk Prediction Agent", cat: "RISK ANALYSIS", time: "09:31:46 AM", desc: "Derailment risk calculated: 87%" },
    { num: 3, name: "Train Operations Agent", cat: "OPERATIONS", time: "09:31:48 AM", desc: "Speed reduced to 40 km/h" },
    { num: 4, name: "Emergency Response Agent", cat: "EMERGENCY", time: "09:31:50 AM", desc: "Maintenance crew dispatched" },
    { num: 5, name: "Passenger Comms Agent", cat: "COMMUNICATION", time: "09:31:51 AM", desc: "Passenger alerts issued" },
    { num: 6, name: "Incident Prevented", cat: "COMPLETE", time: "09:31:52 AM", desc: "Incident prevented successfully" }
  ];

  const sidebarItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'simulator', label: 'CRISIS SIMULATOR', icon: Cpu },
    { id: 'map', label: 'LIVE MAP', icon: Map },
    { id: 'trains', label: 'TRAINS', icon: Train },
    { id: 'stations', label: 'STATIONS', icon: Database },
    { id: 'incidents', label: 'INCIDENTS', icon: AlertCircle },
    { id: 'reports', label: 'REPORTS', icon: FileText },
    { id: 'settings', label: 'SETTINGS', icon: Settings }
  ];

  const weatherData = [
    { station: 'Patna', temp: '28°C', desc: 'Heavy Rain', risk: 'HIGH RISK', riskColor: 'text-rose-500 border-rose-500/20 bg-rose-500/5' },
    { station: 'Prayagraj', temp: '31°C', desc: 'Cloudy', risk: 'MEDIUM RISK', riskColor: 'text-amber-500 border-amber-500/20 bg-amber-500/5' },
    { station: 'Mumbai', temp: '33°C', desc: 'Clear', risk: 'LOW RISK', riskColor: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' },
    { station: 'Kolkata', temp: '29°C', desc: 'Light Rain', risk: 'MEDIUM RISK', riskColor: 'text-amber-500 border-amber-500/20 bg-amber-500/5' },
    { station: 'New Delhi', temp: '35°C', desc: 'Haze', risk: 'LOW RISK', riskColor: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' }
  ];

  const getSystemStatusLabel = () => {
    if (activeStep > 0 && activeStep < 6) {
      return { text: "INCIDENT UNDER RESOLUTION", color: "text-amber-400 bg-amber-950/20 border-amber-900" };
    }
    return { text: "SYSTEM STATUS: OPERATIONAL", color: "text-emerald-400 bg-emerald-950/20 border-emerald-900" };
  };

  const statusLabel = getSystemStatusLabel();

  // Helper to ensure Train 22436 is visible in live overview
  let displayTrains = trains.filter(t => 
    t.train_number.toLowerCase().includes(trainsSearch.toLowerCase()) || 
    t.train_name.toLowerCase().includes(trainsSearch.toLowerCase())
  );
  const vandeBharat = trains.find(t => t.train_number === "22436");
  if (vandeBharat && !displayTrains.some(t => t.train_number === "22436")) {
    displayTrains = [vandeBharat, ...displayTrains];
  }
  const dashboardTrains = displayTrains.slice(0, 5);

  return (
    <div className="h-screen w-screen bg-app text-main flex overflow-hidden select-none transition-colors duration-200">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-[240px] shrink-0 bg-sidebar border-r border-panel flex flex-col justify-between py-5 select-none z-10">
        <div className="space-y-6">
          {/* Logo & Product Name */}
          <div className="px-5 flex items-center gap-3">
            <div className="p-2 bg-slate-900 border border-panel rounded shadow-inner">
              <Shield className="w-5.5 h-5.5 text-sky-500" />
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-widest text-sky-400 font-console leading-none">
                ASTRA RAIL
              </h1>
              <span className="text-[8px] text-desc font-sans uppercase tracking-wider block mt-1">
                Autonomous Railway Intelligence
              </span>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="space-y-1 px-3">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-console transition ${
                    isActive 
                      ? 'bg-sidebar-active text-sky-400 border border-panel' 
                      : 'text-desc hover:text-main hover:bg-panel/40'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="px-5 border-t border-panel/50 pt-4 mt-auto">
          <div className="text-[9px] font-console font-bold text-sky-500/80">
            ASTRA RAIL v1.0
          </div>
          <div className="text-[8px] text-desc uppercase mt-0.5 tracking-wider">
            Predict. Prevent. Protect.
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT PANES */}
      <main className="flex-1 flex flex-col min-w-0 bg-app overflow-hidden">
        
        {/* TOP STATUS HEADER */}
        <header className="h-14 shrink-0 border-b border-panel bg-panel flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3 font-console">
            {/* Live Operational Status */}
            <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-md text-[10px] uppercase font-bold shadow-sm ${statusLabel.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeStep > 0 && activeStep < 6 ? 'led-blink-amber' : 'led-blink-green'}`} />
              <span>{statusLabel.text}</span>
            </div>
          </div>

          {/* Clock Timer, Theme, Profile */}
          <div className="flex items-center gap-4 font-console">
            {/* Live clock calendar */}
            <div className="flex items-center gap-2 border border-panel bg-app/60 px-3 py-1.5 rounded-md text-[10px] text-slate-300 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-bold tracking-wider uppercase">{systemTime}</span>
            </div>

            {/* Theme selector */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 border border-panel bg-panel hover:bg-app/80 text-sky-400 rounded-md transition shadow-sm"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Profile Avatar control */}
            <div className="h-8 border-l border-panel/60 mx-1" />
            <div className="flex items-center gap-2.5 text-[10px]">
              <div className="flex flex-col text-right">
                <span className="font-bold text-main">Control Center</span>
                <span className="text-desc text-[8px] block">Administrator</span>
              </div>
              <div className="w-7.5 h-7.5 bg-sidebar-active border border-panel rounded-full flex items-center justify-center text-sky-400 font-bold">
                CC
              </div>
            </div>
          </div>
        </header>

        {/* PAGE DYNAMIC BODY PANELS */}
        <div className="flex-1 p-5 min-h-0 overflow-y-auto">
          
          {/* TAB 1: MAIN DASHBOARD GRID */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Row 1: Metrics */}
              <DashboardStats stats={stats} />

              {/* Row 2: Grid Layout Map, Stepper, Panels */}
              <div className="grid grid-cols-12 gap-4">
                
                {/* Left Timeline Stepper Card */}
                <div className="col-span-3 h-[420px] bg-panel border border-panel rounded-lg p-4 flex flex-col justify-between font-console">
                  <div className="flex items-center justify-between border-b border-panel pb-2 shrink-0">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                      Agents Coordination Timeline
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleRunStep(activeStep + 1)}
                        disabled={loading || activeStep >= 6}
                        className="p-1 border border-panel rounded hover:bg-app/80 text-sky-400 disabled:opacity-30"
                        title="Step Forward"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={handleReset}
                        disabled={loading || activeStep === 0}
                        className="p-1 border border-panel rounded hover:bg-app/80 text-desc disabled:opacity-30"
                        title="Reset Cascade"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col justify-between py-2 text-[9px] relative mt-1 select-none">
                    {/* Vertical line connector */}
                    <div className="absolute left-[13px] top-[15px] bottom-[15px] w-0.5 bg-panel z-0" />
                    
                    {timelineSteps.map((st) => {
                      const isCompleted = activeStep >= st.num;
                      const isCurrent = activeStep + 1 === st.num;
                      
                      let textStyle = "text-desc/40";
                      let dotColor = "bg-panel border-panel";
                      let borderStyle = "border-panel bg-app/10";

                      if (isCompleted) {
                        textStyle = "text-main";
                        dotColor = "bg-emerald-500 shadow-[0_0_6px_#10b981]";
                        borderStyle = "border-emerald-950/40 bg-emerald-950/5 text-emerald-400";
                      } else if (isCurrent) {
                        textStyle = "text-main font-bold";
                        dotColor = "bg-sky-400 led-blink-cyan";
                        borderStyle = "border-sky-500/40 bg-sky-500/10 text-sky-400";
                      }

                      return (
                        <div key={st.num} className="flex gap-3 items-start relative z-10 py-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-panel bg-panel font-console text-[9px] ${textStyle}`}>
                            {isCompleted ? "✓" : st.num}
                          </div>
                          <div className={`flex-1 border rounded p-2 flex flex-col transition duration-200 ${borderStyle}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-bold">{st.name}</span>
                              <span className="text-[8px] text-desc font-sans font-normal">{st.time}</span>
                            </div>
                            <div className="text-[8.5px] text-desc font-sans mt-0.5 truncate uppercase">{st.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Center Map Card */}
                <div className="col-span-6 h-[420px] bg-panel border border-panel rounded-lg overflow-hidden relative shadow-panel-md">
                  <LiveMap 
                    stations={stations} 
                    trains={trains} 
                    tracks={tracks}
                    activeStep={activeStep}
                    theme={theme}
                  />
                </div>

                {/* Right Alerts & Agent Status Cards */}
                <div className="col-span-3 h-[420px] flex flex-col gap-4">
                  {/* Alerts Card */}
                  <div className="flex-1 bg-panel border border-panel rounded-lg p-4 flex flex-col min-h-0 font-console shadow-sm">
                    <div className="flex items-center justify-between border-b border-panel pb-2 shrink-0">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                        Active Incident Alerts
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1 text-[9px] font-sans">
                      {incidents.filter(i => i.status === "Active").length === 0 ? (
                        <div className="h-full flex items-center justify-center text-desc/50 uppercase text-[9px] tracking-wider">
                          No Active Incidents
                        </div>
                      ) : (
                        incidents.filter(i => i.status === "Active").slice(0, 4).map((inc, idx) => {
                          const isCritical = inc.severity === "Critical" || inc.severity === "CRITICAL";
                          return (
                            <div key={idx} className="p-2 border border-panel rounded-md bg-app/30 flex justify-between items-center gap-2">
                              <div className="space-y-0.5">
                                <h4 className="font-bold font-console text-main truncate max-w-[130px]">
                                  {inc.location.split("(")[0]}
                                </h4>
                                <span className="text-[8.5px] text-desc block truncate max-w-[130px]">{inc.incident_type} defect</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`px-1.5 py-0.5 border rounded leading-none text-[8px] font-bold block text-center uppercase ${
                                  isCritical ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'
                                }`}>
                                  {inc.severity}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Agent Matrix status Card */}
                  <div className="flex-1 bg-panel border border-panel rounded-lg p-4 flex flex-col min-h-0 font-console shadow-sm">
                    <div className="flex items-center justify-between border-b border-panel pb-2 shrink-0">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                        Agent System Status
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 text-[9px] font-console">
                      {[
                        { name: "Track Health Agent", step: 1 },
                        { name: "Risk Prediction Agent", step: 2 },
                        { name: "Crowd Intelligence Agent", step: 6 },
                        { name: "Train Operations Agent", step: 3 },
                        { name: "Emergency Response Agent", step: 4 },
                        { name: "Passenger Comms Agent", step: 5 }
                      ].map((ag, idx) => {
                        const isOnline = activeStep >= ag.step || activeStep === 6;
                        return (
                          <div key={idx} className="flex items-center justify-between py-0.5">
                            <span className="text-main">{ag.name}</span>
                            <span className={`font-bold ${isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>
                              {isOnline ? "ONLINE" : "STANDBY"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 3: Grid Bottom (Train Overviews & Weather) */}
              <div className="grid grid-cols-12 gap-4">
                
                {/* Trains Overview Table */}
                <div className="col-span-9 bg-panel border border-panel rounded-lg p-4 flex flex-col font-console shadow-panel-md">
                  <div className="flex items-center justify-between border-b border-panel pb-2 shrink-0 mb-3.5">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                      Live Train Overview
                    </span>
                    <div className="relative w-48 font-sans">
                      <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search trains..." 
                        value={trainsSearch}
                        onChange={(e) => setTrainsSearch(e.target.value)}
                        className="w-full bg-app border border-panel text-[10px] text-main rounded pl-7 pr-2.5 py-1 focus:outline-none focus:border-sky-500 font-sans"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px] font-sans">
                      <thead>
                        <tr className="border-b border-panel text-slate-400 font-console text-[9px]">
                          <th className="py-2 pr-2">TRAIN NO.</th>
                          <th className="py-2 pr-2">TRAIN NAME</th>
                          <th className="py-2 pr-2">FROM</th>
                          <th className="py-2 pr-2">TO</th>
                          <th className="py-2 pr-2">STATUS</th>
                          <th className="py-2 pr-2">SPEED</th>
                          <th className="py-2 pr-2">LOCATION</th>
                          <th className="py-2">DELAY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-panel/40 text-main">
                        {dashboardTrains.map((tr) => {
                          const isA42Train = tr.train_number === "22436";
                          const isSlowedDown = isA42Train && activeStep >= 3 && activeStep < 6;
                          const currentStatus = isSlowedDown ? "Delayed" : tr.status;
                          const currentSpeed = isSlowedDown ? 40 : tr.average_speed;
                          const currentDelay = isSlowedDown ? "15m" : (currentStatus === "Delayed" ? "20m" : "-");
                          const currentStatusLabel = currentStatus === "Delayed" ? "DELAYED" : "ON TIME";

                          return (
                            <tr key={tr.train_number} className="hover:bg-app/10 transition">
                              <td className="py-2.5 font-console font-bold text-sky-400 pr-2">{tr.train_number}</td>
                              <td className="py-2.5 font-semibold pr-2">{tr.train_name.split("Express")[0]} Express</td>
                              <td className="py-2.5 text-desc pr-2">{tr.source_station.split(" Junction")[0]}</td>
                              <td className="py-2.5 text-desc pr-2">{tr.destination_station.split(" Junction")[0]}</td>
                              <td className="py-2.5 pr-2">
                                <span className={`px-1.5 py-0.5 border rounded-[3px] text-[8px] font-bold tracking-wider leading-none ${
                                  currentStatusLabel === 'DELAYED' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                                }`}>
                                  {currentStatusLabel}
                                </span>
                              </td>
                              <td className="py-2.5 font-console pr-2">{currentSpeed} km/h</td>
                              <td className="py-2.5 text-desc pr-2">
                                {isA42Train ? (activeStep >= 6 ? "Varanasi" : "Prayagraj") : "Jhansi"}
                              </td>
                              <td className="py-2.5 font-console text-desc">{currentDelay}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Weather Overview list */}
                <div className="col-span-3 bg-panel border border-panel rounded-lg p-4 flex flex-col font-console shadow-panel-md">
                  <div className="flex items-center justify-between border-b border-panel pb-2 shrink-0 mb-3">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                      Weather Overview
                    </span>
                  </div>
                  <div className="flex-grow overflow-y-auto space-y-3.5 text-[9px] pr-1">
                    {weatherData.map((w, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 border-b border-panel/30 last:border-b-0">
                        <div className="flex items-center gap-2.5">
                          <CloudSun className="w-4 h-4 text-sky-400" />
                          <div className="flex flex-col font-sans">
                            <span className="font-console text-[9px] font-bold text-main">{w.station}</span>
                            <span className="text-[8px] text-desc">{w.desc}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-main">{w.temp}</span>
                          <span className={`px-1 py-0.2 border rounded leading-none text-[8px] font-bold shrink-0 ${w.riskColor}`}>
                            {w.risk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CRISIS SIMULATOR WORKSPACE */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-12 gap-4 h-full min-h-0 overflow-hidden select-none">
              
              {/* Left Sandbox controller controls */}
              <div className="col-span-3 flex flex-col gap-4 h-full overflow-y-auto pr-1">
                {/* Scenario Selector Dropdown */}
                <div className="bg-panel border border-panel rounded-lg p-4 flex flex-col shadow-sm">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-console mb-3">
                    Incident selector
                  </div>
                  <select
                    value={selectedScenario}
                    onChange={(e) => {
                      setSelectedScenario(e.target.value);
                      setActiveStep(0);
                      setAutopilotResult(null);
                    }}
                    disabled={loading || activeStep > 0}
                    className="w-full bg-app border border-panel text-xs text-main rounded px-2.5 py-2 focus:outline-none focus:border-sky-500 font-console"
                  >
                    {allScenarios.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  {currentScenarioInfo && (
                    <div className="mt-3 p-3 bg-app/40 border border-panel/60 rounded text-[10px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-desc font-console uppercase font-bold">Risk Matrix:</span>
                        <span className={`px-1.5 py-0.5 border rounded leading-none text-[8px] font-bold ${
                          currentScenarioInfo.severity === 'CRITICAL' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'
                        }`}>
                          {currentScenarioInfo.severity}
                        </span>
                      </div>
                      <p className="font-sans text-desc leading-relaxed mt-1 text-[9.5px]">{currentScenarioInfo.description}</p>
                    </div>
                  )}
                </div>

                {/* API Monitor Status card */}
                <div className="bg-panel border border-panel rounded-lg p-4 flex flex-col shadow-sm">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-console mb-3">
                    Secure AI Telemetry Link
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-console">
                    <div className="p-2 bg-app/50 rounded border border-panel flex items-center justify-between">
                      <span>GROQ:</span>
                      <span className={apiStatus?.ai?.groq_configured ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                        {apiStatus?.ai?.groq_configured ? "CONFIGURED" : "FALLBACK"}
                      </span>
                    </div>
                    <div className="p-2 bg-app/50 rounded border border-panel flex items-center justify-between">
                      <span>MISTRAL:</span>
                      <span className={apiStatus?.ai?.mistral_configured ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                        {apiStatus?.ai?.mistral_configured ? "CONFIGURED" : "FALLBACK"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sandbox Input textarea */}
                <div className="bg-panel border border-panel rounded-lg p-4 flex-1 flex flex-col min-h-[300px] shadow-sm">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-console mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Custom Crisis Sandbox
                  </div>
                  <p className="text-[9px] font-sans text-desc mb-3 leading-relaxed">
                    Describe a custom emergency. Groq (Safety Override) & Mistral (Strategic Logistics) will resolve it in combination.
                  </p>
                  <textarea
                    value={customCrisis}
                    onChange={(e) => setCustomCrisis(e.target.value)}
                    disabled={loading || activeStep > 0}
                    placeholder="e.g. Landslide on track section SEC-120 near Kanpur outer..."
                    className="w-full flex-1 bg-app border border-panel text-xs text-main rounded p-2.5 focus:outline-none focus:border-sky-500 font-sans resize-none disabled:opacity-40 leading-relaxed min-h-[120px]"
                  />
                  <div className="mt-4 pt-3 border-t border-panel flex flex-col gap-2 shrink-0">
                    <button
                      onClick={handleAutopilotResolve}
                      disabled={loading || activeStep === 6}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 text-xs rounded transition flex items-center justify-center gap-1.5 uppercase font-console shadow-sm"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>AI Autopilot Resolve</span>
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={loading || activeStep === 0}
                      className="w-full border border-panel text-desc hover:text-main hover:bg-app/60 py-2 text-xs rounded transition flex items-center justify-center gap-1 uppercase font-console"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Engine</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right simulation stream logs */}
              <div className="col-span-9 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
                  {/* Stepper Timeline Controller */}
                  <div className="h-full min-h-0">
                    <ControlPanel 
                      scenarios={allScenarios}
                      selectedScenario={selectedScenario}
                      activeStep={activeStep}
                      loading={loading}
                      stepData={stepData}
                      onSelectScenario={setSelectedScenario}
                      onRunStep={handleRunStep}
                      onReset={handleReset}
                    />
                  </div>

                  {/* Autopilot Results Panel */}
                  <div className="h-full min-h-0">
                    {autopilotResult ? (
                      <div className="bg-panel border border-panel rounded-lg flex flex-col h-full overflow-hidden font-console">
                        {/* Panel header */}
                        <div className="px-4 py-3 shrink-0 border-b border-panel flex items-center gap-2" style={{background:'rgba(8,18,40,0.7)'}}>
                          <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
                          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">Dual-AI Resolution Report</span>
                          <span className="ml-auto text-[9px] font-sans text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10">RESOLVED</span>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                          {/* Groq + Mistral side by side */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Groq */}
                            <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3.5 flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
                                <span className="text-[9px] font-console font-bold text-sky-400 uppercase tracking-widest">Groq · Safety Governor</span>
                              </div>
                              <p className="text-[10px] font-sans text-main/90 leading-relaxed flex-1 italic">"{autopilotResult.groq_analysis.thought}"</p>
                              <div className="text-[10px] font-console text-sky-300 bg-sky-950/30 px-2.5 py-2 rounded border border-sky-900/50 leading-snug">
                                ⚡ {autopilotResult.groq_analysis.action}
                              </div>
                            </div>
                            {/* Mistral */}
                            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3.5 flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                                <span className="text-[9px] font-console font-bold text-indigo-400 uppercase tracking-widest">Mistral · Logistics</span>
                              </div>
                              <p className="text-[10px] font-sans text-main/90 leading-relaxed flex-1 italic">"{autopilotResult.mistral_analysis.thought}"</p>
                              <div className="text-[10px] font-console text-indigo-300 bg-indigo-950/30 px-2.5 py-2 rounded border border-indigo-900/50 leading-snug">
                                🗂 {autopilotResult.mistral_analysis.action}
                              </div>
                            </div>
                          </div>

                          {/* Consensus bar */}
                          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1">Consensus Decision</div>
                              <p className="text-[11px] font-sans text-main leading-relaxed">{autopilotResult.unified_decision}</p>
                            </div>
                          </div>

                          {/* Disaster Assessment */}
                          {autopilotResult.disaster_assessment && (
                            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3.5 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-console font-bold text-amber-400 uppercase tracking-widest">Satellite & Dispatch Verification</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              </div>

                              {/* Scan info */}
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
                                <div className="bg-app/40 border border-panel rounded p-2.5">
                                  <div className="text-[8px] font-console text-desc uppercase font-bold mb-1">📡 Satellite Scan</div>
                                  <p className="text-main leading-snug">{autopilotResult.disaster_assessment.satellite_scan}</p>
                                </div>
                                <div className="bg-app/40 border border-panel rounded p-2.5">
                                  <div className="text-[8px] font-console text-desc uppercase font-bold mb-1">🔗 Verified Via</div>
                                  <p className="text-main leading-snug">{autopilotResult.disaster_assessment.confirmation_sources}</p>
                                </div>
                              </div>

                              {/* Real vs Fake probability */}
                              <div>
                                <div className="flex justify-between text-[10px] font-console font-bold mb-1.5">
                                  <span className="text-emerald-400">✓ REAL: {autopilotResult.disaster_assessment.real_percentage}%</span>
                                  <span className="text-rose-400">✗ FAKE: {autopilotResult.disaster_assessment.fake_percentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-panel border border-panel rounded-full overflow-hidden flex">
                                  <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${autopilotResult.disaster_assessment.real_percentage}%` }} />
                                  <div className="bg-rose-500 h-full" style={{ width: `${autopilotResult.disaster_assessment.fake_percentage}%` }} />
                                </div>
                              </div>

                              {/* Dispatch grid */}
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: '🏥 Hospitals', text: autopilotResult.disaster_assessment.dispatches.hospitals, color: 'emerald' },
                                  { label: '🚒 Firefighters', text: autopilotResult.disaster_assessment.dispatches.firefighters, color: 'rose' },
                                  { label: '📡 SMS Broadcast', text: autopilotResult.disaster_assessment.dispatches.news_broadcast, color: 'sky' },
                                ].map(d => (
                                  <div key={d.label} className="bg-app/50 border border-panel rounded p-2.5">
                                    <div className={`text-[8px] font-console font-bold text-${d.color}-400 uppercase mb-1`}>{d.label}</div>
                                    <p className="text-[9px] font-sans text-main leading-snug">{d.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <AgentTerminal agentStates={agentStates} activeStep={activeStep} />
                    )}
                  </div>
                </div>

                {/* Telemetry stream logs scrollbox */}
                <div className="h-[200px] shrink-0 min-h-0">
                  <AgentFeed events={feedEvents} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FULLSCREEN LIVE MAP */}
          {activeTab === 'map' && (
            <div className="h-full bg-panel border border-panel rounded-lg overflow-hidden relative shadow-panel-md">
              <LiveMap 
                stations={stations} 
                trains={trains} 
                tracks={tracks}
                activeStep={activeStep}
                theme={theme}
              />
            </div>
          )}

          {/* TAB 4: SEARCHABLE TRAINS DIRECTORY LIST */}
          {activeTab === 'trains' && (
            <div className="bg-panel border border-panel rounded-lg p-5 flex flex-col h-full font-console shadow-panel-md overflow-hidden">
              <div className="flex items-center justify-between border-b border-panel pb-3.5 shrink-0 mb-4">
                <div className="flex items-center gap-2 text-sky-400">
                  <Train className="w-5 h-5 text-sky-500" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Comprehensive Trains Directory ({trains.length} total)
                  </span>
                </div>
                <div className="relative w-72 font-sans">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search train name, route, number..." 
                    value={trainsSearch}
                    onChange={(e) => setTrainsSearch(e.target.value)}
                    className="w-full bg-app border border-panel text-xs text-main rounded pl-9 pr-3 py-2 focus:outline-none focus:border-sky-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto font-sans">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-panel text-slate-400 font-console text-[10px] sticky top-0 bg-panel z-10">
                      <th className="py-2.5 pr-2">NUMBER</th>
                      <th className="py-2.5 pr-2">NAME</th>
                      <th className="py-2.5 pr-2">TYPE</th>
                      <th className="py-2.5 pr-2">FROM STATION</th>
                      <th className="py-2.5 pr-2">TO STATION</th>
                      <th className="py-2.5 pr-2">STATUS</th>
                      <th className="py-2.5 pr-2">CAPACITY</th>
                      <th className="py-2.5">SPEED INDEX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-panel/40">
                    {displayTrains.map((tr) => (
                      <tr key={tr.train_number} className="hover:bg-app/10 transition">
                        <td className="py-3 font-console font-bold text-sky-400 pr-2">{tr.train_number}</td>
                        <td className="py-3 font-semibold text-main pr-2">{tr.train_name}</td>
                        <td className="py-3 text-desc pr-2">{tr.train_type}</td>
                        <td className="py-3 text-desc pr-2">{tr.source_station}</td>
                        <td className="py-3 text-desc pr-2">{tr.destination_station}</td>
                        <td className="py-3 pr-2">
                          <span className={`px-1.5 py-0.5 border rounded-[3px] text-[8.5px] font-bold tracking-wider leading-none uppercase ${
                            tr.status === 'Delayed' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                          }`}>
                            {tr.status}
                          </span>
                        </td>
                        <td className="py-3 text-desc pr-2">{tr.capacity} Pax</td>
                        <td className="py-3 font-console text-main">{tr.average_speed} km/h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SEARCHABLE STATIONS DIRECTORY LIST */}
          {activeTab === 'stations' && (
            <div className="bg-panel border border-panel rounded-lg p-5 flex flex-col h-full font-console shadow-panel-md overflow-hidden">
              <div className="flex items-center justify-between border-b border-panel pb-3.5 shrink-0 mb-4">
                <div className="flex items-center gap-2 text-sky-400">
                  <Database className="w-5 h-5 text-sky-500" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Infrastructure Station Nodes ({stations.length} total)
                  </span>
                </div>
                <div className="relative w-72 font-sans">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search station name, code, state..." 
                    value={stationsSearch}
                    onChange={(e) => setStationsSearch(e.target.value)}
                    className="w-full bg-app border border-panel text-xs text-main rounded pl-9 pr-3 py-2 focus:outline-none focus:border-sky-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto font-sans">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-panel text-slate-400 font-console text-[10px] sticky top-0 bg-panel z-10">
                      <th className="py-2.5 pr-2">CODE</th>
                      <th className="py-2.5 pr-2">STATION NAME</th>
                      <th className="py-2.5 pr-2">CITY</th>
                      <th className="py-2.5 pr-2">STATE</th>
                      <th className="py-2.5 pr-2">PLATFORMS</th>
                      <th className="py-2.5 pr-2">DAILY VOLUME</th>
                      <th className="py-2">COORDINATES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-panel/40">
                    {stations.filter(s => 
                      s.station_code.toLowerCase().includes(stationsSearch.toLowerCase()) || 
                      s.station_name.toLowerCase().includes(stationsSearch.toLowerCase()) ||
                      s.state.toLowerCase().includes(stationsSearch.toLowerCase())
                    ).map((st) => (
                      <tr key={st.station_code} className="hover:bg-app/10 transition">
                        <td className="py-3 font-console font-bold text-sky-400 pr-2">{st.station_code}</td>
                        <td className="py-3 font-semibold text-main pr-2">{st.station_name}</td>
                        <td className="py-3 text-desc pr-2">{st.city}</td>
                        <td className="py-3 text-desc pr-2">{st.state}</td>
                        <td className="py-3 text-main text-center pr-2">{st.platforms}</td>
                        <td className="py-3 text-desc pr-2">{st.daily_passengers.toLocaleString()} Pax</td>
                        <td className="py-3 font-console text-desc">{st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: DYNAMIC DATABASE INCIDENTS VIEW */}
          {activeTab === 'incidents' && (
            <div className="grid grid-cols-12 gap-4 h-full min-h-0 overflow-hidden font-console">
              
              {/* Left Column: Incidents Table (2/3 width) */}
              <div className="col-span-8 bg-panel border border-panel rounded-lg p-5 flex flex-col h-full overflow-hidden shadow-panel-md">
                <div className="flex items-center justify-between border-b border-panel pb-3.5 shrink-0 mb-4">
                  <div className="flex items-center gap-2 text-sky-400">
                    <AlertCircle className="w-5 h-5 text-sky-500" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      Railway Incidents Registry ({incidents.length} logs)
                    </span>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-48 font-sans">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search incidents..." 
                        value={incidentsSearch}
                        onChange={(e) => setIncidentsSearch(e.target.value)}
                        className="w-full bg-app border border-panel text-[10px] text-main rounded pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-sky-500 font-sans"
                      />
                    </div>
                    
                    {/* Status filter */}
                    <select
                      value={incidentsFilterStatus}
                      onChange={(e) => setIncidentsFilterStatus(e.target.value)}
                      className="bg-app border border-panel text-[10px] text-main rounded px-2 py-1.5 focus:outline-none focus:border-sky-500 font-sans"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active Only</option>
                      <option value="Resolved">Resolved / Prevented</option>
                    </select>
                    
                    {/* Severity filter */}
                    <select
                      value={incidentsFilterSeverity}
                      onChange={(e) => setIncidentsFilterSeverity(e.target.value)}
                      className="bg-app border border-panel text-[10px] text-main rounded px-2 py-1.5 focus:outline-none focus:border-sky-500 font-sans"
                    >
                      <option value="All">All Severities</option>
                      <option value="Critical">Critical</option>
                      <option value="Major">Major</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Minor">Minor</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto font-sans">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-panel text-slate-400 font-console text-[10px] sticky top-0 bg-panel z-10">
                        <th className="py-2.5 pr-2">INCIDENT ID</th>
                        <th className="py-2.5 pr-2">INCIDENT TYPE</th>
                        <th className="py-2.5 pr-2">LOCATION</th>
                        <th className="py-2.5 pr-2">SEVERITY</th>
                        <th className="py-2.5 pr-2">TIMESTAMP</th>
                        <th className="py-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-panel/40">
                      {incidents.filter(inc => {
                        const matchesSearch = inc.location.toLowerCase().includes(incidentsSearch.toLowerCase()) ||
                                              inc.incident_type.toLowerCase().includes(incidentsSearch.toLowerCase()) ||
                                              inc.incident_id.toLowerCase().includes(incidentsSearch.toLowerCase());
                        const matchesStatus = incidentsFilterStatus === 'All' || 
                                              (incidentsFilterStatus === 'Active' && inc.status === 'Active') ||
                                              (incidentsFilterStatus === 'Resolved' && (inc.status === 'Resolved' || inc.status === 'Prevented'));
                        const matchesSeverity = incidentsFilterSeverity === 'All' || inc.severity.toUpperCase() === incidentsFilterSeverity.toUpperCase();
                        return matchesSearch && matchesStatus && matchesSeverity;
                      }).map((inc) => {
                        const isSelected = selectedIncident?.incident_id === inc.incident_id;
                        const isCritical = inc.severity.toUpperCase() === "CRITICAL" || inc.severity.toUpperCase() === "MAJOR";
                        return (
                          <tr 
                            key={inc.incident_id} 
                            onClick={() => setSelectedIncident(inc)}
                            className={`cursor-pointer transition ${isSelected ? 'bg-sky-500/10 border-l-2 border-l-sky-500' : 'hover:bg-app/10'}`}
                          >
                            <td className="py-3 font-console font-bold text-sky-400 pr-2 pl-2">{inc.incident_id}</td>
                            <td className="py-3 font-semibold text-main pr-2 uppercase font-console text-[10px]">{inc.incident_type}</td>
                            <td className="py-3 text-desc pr-2">{inc.location}</td>
                            <td className="py-3 pr-2">
                              <span className={`px-1.5 py-0.5 border rounded-[3px] text-[8px] font-bold tracking-wider leading-none uppercase ${
                                isCritical ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'
                              }`}>
                                {inc.severity}
                              </span>
                            </td>
                            <td className="py-3 text-desc font-console text-[10px] pr-2">{inc.timestamp}</td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.5 border rounded-[3px] text-[8px] font-bold tracking-wider leading-none uppercase ${
                                inc.status === 'Active' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5 led-blink-amber' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                              }`}>
                                {inc.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Incident Telemetry & Response Dispatch (1/3 width) */}
              <div className="col-span-4 flex flex-col gap-4 h-full overflow-y-auto">
                {selectedIncident ? (
                  <div className="bg-panel border border-panel rounded-lg p-5 flex flex-col h-full font-console shadow-panel-md overflow-y-auto">
                    <div className="border-b border-panel pb-3 mb-4">
                      <span className="text-[9px] text-sky-400 font-bold block uppercase tracking-widest">
                        Selected Incident Details
                      </span>
                      <h3 className="text-sm font-bold text-main mt-1 uppercase font-console">
                        {selectedIncident.incident_id}
                      </h3>
                    </div>

                    <div className="space-y-4 font-sans text-xs flex-grow">
                      {/* Meta information */}
                      <div className="bg-app/40 border border-panel/50 rounded-lg p-3 space-y-2.5 font-console text-[10px]">
                        <div className="flex justify-between border-b border-panel/30 pb-1.5">
                          <span className="text-desc">INCIDENT TYPE:</span>
                          <span className="text-main font-bold uppercase">{selectedIncident.incident_type}</span>
                        </div>
                        <div className="flex justify-between border-b border-panel/30 pb-1.5">
                          <span className="text-desc">SEVERITY RANK:</span>
                          <span className={`font-bold ${
                            selectedIncident.severity.toUpperCase() === "CRITICAL" ? 'text-rose-500' : 'text-amber-400'
                          }`}>{selectedIncident.severity.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between border-b border-panel/30 pb-1.5">
                          <span className="text-desc">TIMESTAMP:</span>
                          <span className="text-main">{selectedIncident.timestamp}</span>
                        </div>
                        <div className="flex justify-between pb-0.5">
                          <span className="text-desc">SYSTEM STATUS:</span>
                          <span className={`font-bold ${selectedIncident.status === 'Active' ? 'text-amber-400' : 'text-emerald-500'}`}>
                            {selectedIncident.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Location Map Segment */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-desc font-console uppercase font-bold tracking-wider">Geographic Boundary:</span>
                        <p className="text-main text-[11px] bg-app/20 p-2.5 border border-panel rounded-md font-medium leading-relaxed font-sans">
                          {selectedIncident.location}
                        </p>
                      </div>

                      {/* Satellite & Visual verification segment (matching User prompt 7) */}
                      <div className="border border-panel rounded-lg p-3 bg-app/30 space-y-2.5">
                        <div className="text-[9px] font-console font-bold text-sky-400 uppercase tracking-wider flex justify-between border-b border-panel/40 pb-1.5">
                          <span>SATELLITE IMAGE SCANNER</span>
                          <span className="led-blink-cyan w-1.5 h-1.5 rounded-full" />
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-[8px] text-desc font-console uppercase block font-bold">Orbit Cam Radar Feed:</span>
                            <p className="text-main text-[10.5px] italic leading-snug mt-1 bg-app/40 p-2 border border-panel/50 rounded font-sans">
                              {selectedIncident.incident_type === 'flood'
                                ? "Synthetic Aperture Radar (SAR) logs confirm high-density track submergence on segment SEC-088. Ballast water levels exceed 115mm limits."
                                : selectedIncident.incident_type === 'signal failure'
                                  ? "Thermal imaging checks confirm signaling lockout. Relay cabinet register abnormal temperature spike (62.3°C)."
                                  : "Laser visual interferometry registers micro-deformation on structural track gauge joints. Geometry deviance exceeded."}
                            </p>
                          </div>
                          <div>
                            <span className="text-[8px] text-desc font-console uppercase block font-bold">Verification Sources:</span>
                            <p className="text-main text-[10px] leading-snug mt-1 bg-app/40 p-2 border border-panel/50 rounded font-sans">
                              Cross-referenced orbital visuals with active cabin TV feedback and telemetry sensors.
                            </p>
                          </div>
                        </div>

                        {/* Real vs Fake Confidence index */}
                        <div className="space-y-1 font-console text-[9px] pt-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-emerald-500">REAL: 96.4%</span>
                            <span className="text-rose-500">FAKE: 3.6%</span>
                          </div>
                          <div className="w-full h-1.5 bg-panel border border-panel rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: '96.4%' }} />
                            <div className="bg-rose-500 h-full" style={{ width: '3.6%' }} />
                          </div>
                        </div>
                      </div>

                      {/* Crew Dispatch Info parsed from SQLite */}
                      <div className="border border-panel rounded-lg p-3 bg-app/30 space-y-2">
                        <div className="text-[9px] font-console font-bold text-sky-400 uppercase tracking-wider border-b border-panel/40 pb-1.5">
                          CREW DISPATCH STATUS
                        </div>
                        {emergencyResponses.some(r => r.incident_id === selectedIncident.incident_id) ? (
                          emergencyResponses.filter(r => r.incident_id === selectedIncident.incident_id).map((resp, idx) => (
                            <div key={idx} className="space-y-2 font-console text-[10px]">
                              <div className="flex justify-between">
                                <span className="text-desc">TEAM ASSIGNED:</span>
                                <span className="text-main font-bold">{resp.team_assigned}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-desc">RESPONSE TIME:</span>
                                <span className="text-main font-bold text-sky-400">{resp.response_time} minutes</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-desc">DEPLOYMENT STATE:</span>
                                <span className={`font-bold ${
                                  resp.resolution_status === 'Resolved' ? 'text-emerald-500' : 'text-amber-500 led-blink-amber'
                                }`}>{resp.resolution_status.toUpperCase()}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-desc/60 italic font-console py-1">
                            No physical emergency responses logged in database registry. Autopilot handled safety restrictions remotely.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedIncident.status === 'Active' && (
                      <button
                        onClick={() => {
                          setSelectedScenario(
                            selectedIncident.incident_type === 'track defect' ? 'A-42-fracture' :
                            selectedIncident.incident_type === 'flood' ? 'flood' : 'signal-failure'
                          );
                          setActiveTab('simulator');
                        }}
                        className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 text-xs rounded transition flex items-center justify-center gap-1.5 uppercase font-console shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Solve in Simulator workspace</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-panel border border-panel rounded-lg p-5 flex items-center justify-center h-full text-desc font-console text-xs uppercase tracking-wider">
                    Select an incident to investigate
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SAFETY REPORTS COMPILER */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-12 gap-4 h-full min-h-0 overflow-hidden font-console">
              
              {/* Left Panel: Generator config (1/3 width) */}
              <div className="col-span-4 bg-panel border border-panel rounded-lg p-5 flex flex-col justify-between h-full shadow-panel-md">
                <div className="space-y-5">
                  <div className="border-b border-panel pb-3 flex items-center gap-2 text-sky-400">
                    <FileText className="w-5 h-5 text-sky-500" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      Railway Reports Generator
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Report Type selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-desc font-bold uppercase">Report Category:</label>
                      <select
                        value={selectedReportType}
                        onChange={(e) => setSelectedReportType(e.target.value)}
                        className="bg-app border border-panel text-xs text-main rounded px-3 py-2.5 focus:outline-none focus:border-sky-500 font-sans"
                      >
                        <option value="incident-registry">Incident Registry & AI Resolutions Analysis</option>
                        <option value="track-health">Infrastructure Track Health & Maintenance Audit</option>
                        <option value="dispatch-efficiency">Emergency Response & Logistics Performance</option>
                      </select>
                    </div>

                    {/* Report Timeframe selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-desc font-bold uppercase">Incident History Timeframe:</label>
                      <select
                        value={selectedReportTime}
                        onChange={(e) => setSelectedReportTime(e.target.value)}
                        className="bg-app border border-panel text-xs text-main rounded px-3 py-2.5 focus:outline-none focus:border-sky-500 font-sans"
                      >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                      </select>
                    </div>

                    {/* Notice */}
                    <div className="p-3.5 bg-sky-950/10 border border-sky-900/30 rounded-lg text-[9.5px] font-sans text-desc leading-relaxed">
                      <span className="font-bold font-console text-sky-400 block mb-1">SYSTEM AUTOMATION NOTICE</span>
                      Reports are dynamically compiled by extracting real-time parameters from the active SQL database nodes. All entries verify safety index metrics.
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 text-xs rounded transition flex items-center justify-center gap-2 uppercase font-console shadow-sm mt-4 disabled:opacity-50"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Compiling database logs...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate Safety Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Panel: Report Viewer Output (2/3 width) */}
              <div className="col-span-8 bg-panel border border-panel rounded-lg p-5 flex flex-col h-full shadow-panel-md overflow-hidden">
                {generatedReport ? (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between border-b border-panel pb-3.5 shrink-0 mb-4">
                      <div>
                        <span className="text-[9px] text-sky-400 font-bold block uppercase tracking-widest">
                          Document ID: {generatedReport.id}
                        </span>
                        <h3 className="text-sm font-bold text-main mt-0.5">
                          {generatedReport.title}
                        </h3>
                      </div>

                      {/* Copy actions */}
                      <button
                        onClick={() => {
                          const text = JSON.stringify(generatedReport, null, 2);
                          navigator.clipboard.writeText(text);
                          setReportCopied(true);
                          setTimeout(() => setReportCopied(false), 2000);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-panel hover:bg-app/80 text-[10px] text-sky-400 font-bold rounded transition"
                      >
                        {reportCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{reportCopied ? "COPIED" : "EXPORT TO JSON"}</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[10px] text-slate-300 bg-app/40 border border-panel p-4.5 rounded-lg select-text leading-relaxed">
                      <div>
                        ========================================================================<br />
                        ASTRA RAIL SAFETY CONTROL CENTER - AUDIT LOG REPORT & TELEMETRY OUT<br />
                        ========================================================================<br />
                        GENERATED TIMESTAMP: {generatedReport.generatedAt}<br />
                        COMPLIANCE WINDOW  : {generatedReport.timeframe}<br />
                        REPORT CLASS       : {generatedReport.type}<br />
                        ========================================================================
                      </div>

                      {/* Summary Blocks */}
                      <div>
                        <span className="text-sky-400 font-bold block">1. DATABASE SUMMARY METRICS</span>
                        ------------------------------------------------------------------------<br />
                        {Object.entries(generatedReport.summary).map(([key, val]) => (
                          <div key={key}>
                            {key.padEnd(30, ' ')}: {val as any}
                          </div>
                        ))}
                      </div>

                      {/* Details Listing */}
                      <div>
                        <span className="text-sky-400 font-bold block">2. SEGMENT telemetry RECORDS</span>
                        ------------------------------------------------------------------------<br />
                        {generatedReport.type === 'INCIDENT_REGISTRY_AUDIT' && (
                          <table className="w-full text-left text-[9.5px]">
                            <thead>
                              <tr className="border-b border-panel/30 text-desc font-sans">
                                <th className="pb-1.5 pr-2 font-console text-[10px]">ID</th>
                                <th className="pb-1.5 pr-2 font-console text-[10px]">TYPE</th>
                                <th className="pb-1.5 pr-2 font-console text-[10px]">LOCATION</th>
                                <th className="pb-1.5 pr-2 font-console text-[10px]">SEVERITY</th>
                                <th className="pb-1.5 font-console text-[10px]">STATUS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedReport.details.slice(0, 15).map((d: any) => (
                                <tr key={d.id} className="border-b border-panel/10 last:border-0 hover:bg-panel/10 font-sans">
                                  <td className="py-1 text-sky-400 font-bold pr-2 font-mono">{d.id}</td>
                                  <td className="py-1 pr-2">{d.type}</td>
                                  <td className="py-1 text-slate-400 pr-2 truncate max-w-[150px]">{d.location}</td>
                                  <td className="py-1 pr-2 font-bold">{d.severity}</td>
                                  <td className="py-1 text-emerald-400">{d.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {generatedReport.type === 'TRACK_HEALTH_AUDIT' && (
                          <table className="w-full text-left text-[9.5px]">
                            <thead>
                              <tr className="border-b border-panel/30 text-desc font-sans">
                                <th className="pb-1.5 pr-2 font-console text-[10px]">SECTION</th>
                                <th className="pb-1.5 pr-2 font-console text-[10px]">GEOGRAPHIC LINK</th>
                                <th className="pb-1.5 pr-2 font-console text-[10px]">HEALTH INDEX</th>
                                <th className="pb-1.5 font-console text-[10px]">RECOMMENDED ACTION</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedReport.details.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-2 text-emerald-400 italic">All track sections score above 85% health limits. Nominal.</td>
                                </tr>
                              ) : (
                                generatedReport.details.map((d: any) => (
                                  <tr key={d.section} className="border-b border-panel/10 last:border-0 hover:bg-panel/10 font-sans">
                                    <td className="py-1 text-sky-400 font-bold pr-2 font-mono">{d.section}</td>
                                    <td className="py-1 text-slate-400 pr-2 truncate max-w-[160px]">{d.location}</td>
                                    <td className="py-1 pr-2 font-bold text-rose-400">{d.health}</td>
                                    <td className="py-1 text-desc font-sans text-[8.5px]">{d.action}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        )}

                        {generatedReport.type === 'EMERGENCY_LOGISTICS_AUDIT' && (
                          <table className="w-full text-left text-[9.5px]">
                            <thead>
                              <tr className="border-b border-panel/30 text-desc font-sans">
                                <th className="pb-1.5 pr-2 font-console text-[10px]">INCIDENT ID</th>
                                <th className="pb-1.5 pr-2 font-console text-[10px]">TEAM ASSIGNED</th>
                                <th className="pb-1.5 pr-2 font-console text-[10px]">RESPONSE TIME</th>
                                <th className="pb-1.5 font-console text-[10px]">STATE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedReport.details.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-2 text-desc/60 italic">No dispatches resolved in target compliance timeline.</td>
                                </tr>
                              ) : (
                                generatedReport.details.map((d: any, idx: number) => (
                                  <tr key={idx} className="border-b border-panel/10 last:border-0 hover:bg-panel/10 font-sans">
                                    <td className="py-1 text-sky-400 font-bold pr-2 font-mono">{d.incident}</td>
                                    <td className="py-1 text-slate-400 pr-2">{d.team}</td>
                                    <td className="py-1 text-main font-bold pr-2">{d.responseTime}</td>
                                    <td className="py-1 text-emerald-400">{d.status}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div>
                        ========================================================================<br />
                        END OF ASTRA RAIL SYSTEMS AUDIT REPORT. CERTIFIED SECURE OPERATIONAL BLOCK.<br />
                        ========================================================================
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <FileText className="w-12 h-12 text-desc/30" />
                    <div>
                      <h4 className="text-xs font-bold text-main uppercase">No Active Report Compiled</h4>
                      <p className="text-[10px] text-desc font-sans mt-1 max-w-[280px]">
                        Select a category and history threshold on the generator control panel, and click "Generate Safety Report".
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: SYSTEMS SETTINGS WORKSPACE */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-12 gap-4 h-full min-h-0 overflow-y-auto font-console">
              
              {/* Left Column: API Gateways and General Config (2/3 width) */}
              <div className="col-span-8 space-y-4">
         
                {/* Display settings and preferences */}
                <div className="bg-panel border border-panel rounded-lg p-5 shadow-panel-md">
                  <div className="border-b border-panel pb-3 flex items-center gap-2 text-sky-400 mb-4">
                    <Settings className="w-5 h-5 text-sky-500" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      User Preferences
                    </span>
                  </div>

                  <div className="space-y-4 font-sans text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-panel/30">
                      <div>
                        <span className="text-[10px] font-console font-bold text-main uppercase block">Display Interface Theme</span>
                        <span className="text-[9px] text-desc font-sans mt-0.5 block">Toggle between premium high-contrast dark space and light dashboard styles.</span>
                      </div>
                      <button
                        onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                        className="px-4 py-2 border border-panel hover:bg-app/80 text-[10px] text-sky-400 font-bold rounded uppercase font-console"
                      >
                        {theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pb-1">
                      <div>
                        <span className="text-[10px] font-console font-bold text-main uppercase block">Telemetry Refresh Frequency</span>
                        <span className="text-[9px] text-desc font-sans mt-0.5 block">Select dashboard synchronization interval for SQLite active feeds.</span>
                      </div>
                      <select
                        defaultValue="manual"
                        className="bg-app border border-panel text-xs text-main rounded px-3 py-2 focus:outline-none focus:border-sky-500 font-console"
                      >
                        <option value="manual">Manual Pull Only</option>
                        <option value="5s">Interval 5 Seconds</option>
                        <option value="15s">Interval 15 Seconds</option>
                        <option value="30s">Interval 30 Seconds</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Database and Diagnostics (1/3 width) */}
              <div className="col-span-4 bg-panel border border-panel rounded-lg p-5 flex flex-col h-full shadow-panel-md">
                <div className="border-b border-panel pb-3 flex items-center gap-2 text-sky-400 mb-4">
                  <Database className="w-5 h-5 text-sky-500" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    SQLite Diagnostics
                  </span>
                </div>

                <p className="text-[10px] font-sans text-desc mb-4 leading-relaxed">
                  ASTRA Rail logs telemetry coordinates and train scheduling records in a local SQLite connection layer. Below is the diagnostic statistics summary.
                </p>

                <div className="space-y-4 font-console text-[10.5px] flex-grow">
                  <div className="bg-app/50 border border-panel rounded-lg p-3.5 space-y-2.5">
                    <div className="flex justify-between border-b border-panel/30 pb-1.5">
                      <span className="text-desc text-[9px]">CONNECTION STATE:</span>
                      <span className="text-emerald-500 font-bold">SQLITE_OK</span>
                    </div>
                    <div className="flex justify-between border-b border-panel/30 pb-1.5">
                      <span className="text-desc text-[9px]">REGISTRY SOURCE:</span>
                      <span className="text-main font-bold">astra_rail.db</span>
                    </div>
                    <div className="flex justify-between border-b border-panel/30 pb-1.5">
                      <span className="text-desc text-[9px]">TRAIN STATIONS:</span>
                      <span className="text-sky-400 font-bold">{stations.length} NODES</span>
                    </div>
                    <div className="flex justify-between border-b border-panel/30 pb-1.5">
                      <span className="text-desc text-[9px]">ACTIVE TRAINS:</span>
                      <span className="text-sky-400 font-bold">{trains.length} FLEETS</span>
                    </div>
                    <div className="flex justify-between border-b border-panel/30 pb-1.5">
                      <span className="text-desc text-[9px]">LOGGED INCIDENTS:</span>
                      <span className="text-sky-400 font-bold">{incidents.length} ENTRIES</span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-desc text-[9px]">DISPATCH ASSIGNS:</span>
                      <span className="text-sky-400 font-bold">{emergencyResponses.length} TEAMS</span>
                    </div>
                  </div>

                  <div className="bg-app/30 border border-panel/50 rounded-lg p-3 text-[9px] font-sans text-desc space-y-1.5 leading-relaxed">
                    <span className="text-[8.5px] font-console font-bold text-sky-400 uppercase block">TELEMETRY SYSTEM METADATA:</span>
                    <div>• Version code: ASTRA Rail CC v1.0.4</div>
                    <div>• Deployment topology: Single-origin Vercel project</div>
                    <div>• API state indicator: Dual-LLM safety checks</div>
                    <div>• API route namespace: <span className="font-mono text-[8.5px] text-main">/api/*</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
