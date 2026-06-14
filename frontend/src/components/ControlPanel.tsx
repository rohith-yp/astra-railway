import React, { useState } from 'react';
import { RotateCcw, ShieldCheck, Zap, CheckCircle2, AlertTriangle, Database, Radio } from 'lucide-react';

interface StepPayload {
  step: number;
  agent: string;
  title: string;
  message: string;
  db_changes: string;
}

interface ControlPanelProps {
  scenarios: any[];
  selectedScenario: string;
  activeStep: number;
  loading: boolean;
  stepData: Record<number, StepPayload>;
  onSelectScenario: (id: string) => void;
  onRunStep: (stepNum: number) => void;
  onReset: () => void;
}

const PIPELINE_STEPS = [
  {
    num: 1,
    label: "Track Health Scan",
    agent: "TrackHealthAgent",
    role: "Sensor & Structural Monitor",
    icon: "📡",
    accent: "#38bdf8", // sky
    accentCls: "border-sky-500/50 bg-sky-500/8 text-sky-300",
    dotCls: "bg-sky-400",
  },
  {
    num: 2,
    label: "Risk Computation",
    agent: "RiskPredictionAgent",
    role: "Derailment Probability Engine",
    icon: "⚠️",
    accent: "#f59e0b",
    accentCls: "border-amber-500/50 bg-amber-500/8 text-amber-300",
    dotCls: "bg-amber-400",
  },
  {
    num: 3,
    label: "Train Operations",
    agent: "TrainOperationsAgent",
    role: "Speed & Route Control",
    icon: "🚆",
    accent: "#fb923c",
    accentCls: "border-orange-500/50 bg-orange-500/8 text-orange-300",
    dotCls: "bg-orange-400",
  },
  {
    num: 4,
    label: "Emergency Dispatch",
    agent: "EmergencyResponseAgent",
    role: "Crew Mobilization & Field Ops",
    icon: "🚨",
    accent: "#f43f5e",
    accentCls: "border-rose-500/50 bg-rose-500/8 text-rose-300",
    dotCls: "bg-rose-400",
  },
  {
    num: 5,
    label: "Passenger Alerts",
    agent: "PassengerCommunicationAgent",
    role: "SMS, Display & Broadcast",
    icon: "📢",
    accent: "#a78bfa",
    accentCls: "border-violet-500/50 bg-violet-500/8 text-violet-300",
    dotCls: "bg-violet-400",
  },
  {
    num: 6,
    label: "Crisis Neutralised",
    agent: "CrowdIntelligenceAgent",
    role: "Final Validation & DB Closure",
    icon: "✅",
    accent: "#10b981",
    accentCls: "border-emerald-500/50 bg-emerald-500/8 text-emerald-300",
    dotCls: "bg-emerald-400",
  },
];

export default function ControlPanel({
  scenarios,
  selectedScenario,
  activeStep,
  loading,
  stepData,
  onSelectScenario,
  onRunStep,
  onReset,
}: ControlPanelProps) {
  const [autoRunning, setAutoRunning] = useState(false);

  const handleLaunch = async () => {
    if (autoRunning || loading) return;
    setAutoRunning(true);

    let current = activeStep;
    if (current >= 6) {
      onReset();
      current = 0;
      await new Promise((r) => setTimeout(r, 700));
    }

    for (let s = current + 1; s <= 6; s++) {
      onRunStep(s);
      await new Promise((r) => setTimeout(r, 2400));
    }

    setAutoRunning(false);
  };

  const isRunning = autoRunning || loading;
  const progressPct = (activeStep / 6) * 100;

  return (
    <div className="flex flex-col h-full bg-panel border border-panel rounded-lg font-console overflow-hidden shadow-panel-md">
      {/* Header */}
      <div
        className="px-4 py-3 shrink-0 border-b border-panel flex items-center justify-between"
        style={{ background: 'rgba(8,18,40,0.7)' }}
      >
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
            Emergency Response Pipeline
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeStep > 0 && activeStep < 6 && (
            <span className="text-[9px] font-console text-cyan-400 uppercase font-bold px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 animate-pulse">
              LIVE
            </span>
          )}
          {activeStep === 6 && (
            <span className="text-[9px] font-console text-emerald-400 uppercase font-bold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10">
              RESOLVED
            </span>
          )}
          <span className="text-[9px] text-desc uppercase">{activeStep}/6</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-panel/60 shrink-0">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background:
              activeStep === 6
                ? 'linear-gradient(90deg,#10b981,#34d399)'
                : 'linear-gradient(90deg,#0ea5e9,#6366f1)',
          }}
        />
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2 min-h-0">
        {PIPELINE_STEPS.map((st) => {
          const completed = activeStep >= st.num;
          const active = activeStep + 1 === st.num && isRunning;
          const payload = stepData[st.num];

          return (
            <div
              key={st.num}
              className={`rounded-lg border transition-all duration-400 ${
                completed
                  ? st.accentCls
                  : active
                  ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-300'
                  : 'border-panel/40 bg-app/20 text-desc opacity-50'
              }`}
            >
              {/* Step header */}
              <div className="flex items-center gap-2.5 px-3 py-2">
                <span className="text-sm shrink-0">{st.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-console font-bold uppercase opacity-70">
                      Step {st.num}
                    </span>
                    <span className="text-[9px] opacity-50">·</span>
                    <span className="text-[9px] font-sans opacity-60 truncate">{st.role}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide truncate">
                    {st.label}
                  </div>
                </div>
                <div className="shrink-0">
                  {completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : active ? (
                    <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full border border-current opacity-40" />
                  )}
                </div>
              </div>

              {/* Expanded result when completed */}
              {completed && payload && (
                <div className="border-t border-current/20 px-3 pb-2.5 pt-2 space-y-1.5">
                  <p className="text-[10px] font-sans leading-snug text-current/90">
                    {payload.message}
                  </p>
                  <div className="flex items-start gap-1.5 text-[9px] font-sans text-current/60">
                    <Database className="w-3 h-3 shrink-0 mt-px" />
                    <span className="leading-tight">{payload.db_changes}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Success banner */}
        {activeStep === 6 && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase">
                Crisis Prevented
              </div>
              <div className="text-[9px] font-sans text-emerald-300/70 mt-0.5">
                All 6 agents resolved the incident. Database updated.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom control */}
      <div className="px-3 pb-3 pt-2 border-t border-panel shrink-0 space-y-2">
        <button
          onClick={handleLaunch}
          disabled={isRunning || activeStep === 6}
          className="w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
          style={{
            background: isRunning
              ? 'rgba(14,165,233,0.15)'
              : 'linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)',
            color: '#fff',
            boxShadow: isRunning ? 'none' : '0 0 20px rgba(99,102,241,0.35)',
          }}
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              <span>Running Protocol...</span>
            </>
          ) : activeStep === 6 ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protocol Complete</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>
                {activeStep === 0 ? 'Activate Emergency Protocol' : `Resume — Step ${activeStep + 1}`}
              </span>
            </>
          )}
        </button>

        {activeStep > 0 && (
          <button
            onClick={onReset}
            disabled={isRunning}
            className="w-full py-1.5 border border-panel text-desc hover:text-main hover:bg-app/60 text-[10px] rounded transition flex items-center justify-center gap-1 uppercase"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Simulation</span>
          </button>
        )}
      </div>
    </div>
  );
}
