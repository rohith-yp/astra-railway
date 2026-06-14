import React, { useState } from 'react';
import { Cpu, Lightbulb, BarChart2, CheckCircle2, MessageSquare, RefreshCw, Layers } from 'lucide-react';

interface AgentDetails {
  thought: string;
  analysis: string;
  decision: string;
  communication: string;
  coordination: string;
  action: string;
}

interface AgentTerminalProps {
  agentStates: Record<string, AgentDetails | null>;
  activeStep: number;
}

const AGENT_LIST = [
  { id: 'TrackHealthAgent', name: 'TRACK HEALTH', role: 'Telemetry scans & defect checks' },
  { id: 'RiskPredictionAgent', name: 'RISK PREDICTION', role: 'Derailment threat matrix modeling' },
  { id: 'TrainOperationsAgent', name: 'TRAIN OPERATIONS', role: 'Speed restricts & route diversion' },
  { id: 'EmergencyResponseAgent', name: 'EMERGENCY RESPONSE', role: 'Repair crew mobilization' },
  { id: 'PassengerCommunicationAgent', name: 'PASSENGER COMM', role: 'Schedule delay broadcasts' },
  { id: 'CrowdIntelligenceAgent', name: 'CROWD INTEL', role: 'Platform crowd control guides' },
];

export default function AgentTerminal({ agentStates, activeStep }: AgentTerminalProps) {
  const [selectedAgent, setSelectedAgent] = useState('TrackHealthAgent');

  const activeData = agentStates[selectedAgent];

  const getStepStatus = (agentId: string) => {
    const stepMapping: Record<string, number> = {
      'TrackHealthAgent': 1,
      'RiskPredictionAgent': 2,
      'TrainOperationsAgent': 3,
      'EmergencyResponseAgent': 4,
      'PassengerCommunicationAgent': 5,
      'CrowdIntelligenceAgent': 6
    };
    
    const mapped = stepMapping[agentId];
    if (activeStep >= mapped) {
      return { label: 'SUCCESS', color: 'text-emerald-400 border-emerald-950 bg-emerald-950/20' };
    }
    if (activeStep + 1 === mapped) {
      return { label: 'PENDING', color: 'text-cyan-400 border-cyan-950 bg-cyan-950/20 led-blink-cyan' };
    }
    return { label: 'STANDBY', color: 'text-slate-500 border-slate-900 bg-slate-950/40' };
  };

  return (
    <div className="flex flex-col h-full bg-panel border border-panel rounded font-console overflow-hidden shadow-panel-md">
      {/* Title */}
      <div className="p-3 border-b border-panel bg-app/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">COGNITIVE AGENT DIAGNOSTICS</span>
        </div>
        <span className="text-[10px] text-desc uppercase">AGENT MATRIX</span>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Agent Selector Panel */}
        <div className="w-1/3 border-r border-panel flex flex-col overflow-y-auto bg-app/20">
          {AGENT_LIST.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            const status = getStepStatus(agent.id);
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`p-3 text-left border-b border-panel/40 transition hover:bg-app/40 flex flex-col gap-1 relative ${
                  isSelected ? 'bg-app/80 border-l-2 border-l-cyan-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase ${isSelected ? 'text-cyan-400 font-bold' : 'text-main'}`}>
                    {agent.name}
                  </span>
                  <span className={`text-[8px] px-1 py-0.5 border rounded leading-none ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <span className="text-[10px] text-desc font-sans truncate uppercase">{agent.role}</span>
              </button>
            );
          })}
        </div>

        {/* Right Console Output Panel */}
        <div className="w-2/3 p-4 overflow-y-auto flex flex-col">
          {activeData ? (
            <div className="space-y-4 text-xs">
              {/* Agent Title Header */}
              <div className="border-b border-panel pb-2">
                <h3 className="text-sm text-cyan-400 uppercase font-bold tracking-wider">{selectedAgent} LOGS</h3>
                <p className="text-[10px] text-desc mt-1 uppercase font-sans">
                  Monologue sequence registered in database registry.
                </p>
              </div>

              {/* Cognitive Fields */}
              <div className="grid grid-cols-1 gap-4 font-sans">
                {/* THOUGHT */}
                <div className="bg-app/20 border border-panel rounded p-2.5 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-console text-[10px] uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Thought Process</span>
                  </div>
                  <p className="text-main leading-relaxed pl-5 text-[11px]">{activeData.thought}</p>
                </div>

                {/* ANALYSIS */}
                <div className="bg-app/20 border border-panel rounded p-2.5 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-console text-[10px] uppercase tracking-wider">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Anomalous Analysis</span>
                  </div>
                  <p className="text-main leading-relaxed pl-5 text-[11px]">{activeData.analysis}</p>
                </div>

                {/* DECISION */}
                <div className="bg-app/20 border border-panel rounded p-2.5 space-y-1">
                  <div className="flex items-center gap-2 text-amber-500 font-console text-[10px] uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" />
                    <span>System Decision</span>
                  </div>
                  <p className="text-main leading-relaxed pl-5 text-[11px]">{activeData.decision}</p>
                </div>

                {/* COMMUNICATION */}
                <div className="bg-app/20 border border-panel rounded p-2.5 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-console text-[10px] uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Broadcasting Alert</span>
                  </div>
                  <p className="text-main leading-relaxed pl-5 text-[11px]">{activeData.communication}</p>
                </div>

                {/* COORDINATION */}
                <div className="bg-app/20 border border-panel rounded p-2.5 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-console text-[10px] uppercase tracking-wider">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Coordination Targets</span>
                  </div>
                  <p className="text-main leading-relaxed pl-5 text-[11px]">{activeData.coordination}</p>
                </div>

                {/* ACTION */}
                <div className="bg-app/20 border border-panel rounded p-2.5 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-500 font-console text-[10px] uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Database Action executed</span>
                  </div>
                  <p className="text-main leading-relaxed pl-5 text-[11px]">{activeData.action}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center flex-col text-desc gap-2 font-console">
              <Cpu className="w-8 h-8 opacity-40 animate-pulse" />
              <span className="uppercase tracking-widest text-[10px]">Awaiting agent activation sequence</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
