import React, { useEffect, useRef } from 'react';
import { Terminal, Shield } from 'lucide-react';

interface FeedEvent {
  time: string;
  agent: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
}

interface AgentFeedProps {
  events: FeedEvent[];
}

export default function AgentFeed({ events }: AgentFeedProps) {
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'TrackHealthAgent':
        return 'text-teal-400 bg-teal-950/40 border-teal-800';
      case 'RiskPredictionAgent':
        return 'text-rose-400 bg-rose-950/40 border-rose-800';
      case 'TrainOperationsAgent':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-800';
      case 'EmergencyResponseAgent':
        return 'text-indigo-400 bg-indigo-950/40 border-indigo-800';
      case 'PassengerCommunicationAgent':
        return 'text-amber-400 bg-amber-950/40 border-amber-800';
      case 'CrowdIntelligenceAgent':
        return 'text-purple-400 bg-purple-950/40 border-purple-800';
      default:
        return 'text-slate-400 bg-slate-900/40 border-slate-800';
    }
  };

  const getLogTypeIcon = (type: string) => {
    if (type === 'alert' || type === 'warning') return '⚠️';
    if (type === 'success') return '✓';
    return '»';
  };

  return (
    <div className="flex flex-col h-full bg-panel border border-panel rounded font-console overflow-hidden shadow-panel-md">
      {/* Feed Title Panel */}
      <div className="p-3 border-b border-panel bg-app/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">AGENT TELEMETRY STREAM</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] text-desc uppercase">TELEMETRY ON</span>
        </div>
      </div>

      {/* Feed Logs Scrollbox */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs select-text">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col gap-2 text-desc">
            <Shield className="w-8 h-8 opacity-40 stroke-1" />
            <span className="uppercase tracking-widest text-[10px]">No active telemetry signals</span>
          </div>
        ) : (
          events.map((ev, idx) => (
            <div 
              key={idx} 
              className={`p-2 border rounded-sm flex flex-col md:flex-row md:items-center gap-2 bg-app/30 border-panel/50 leading-relaxed`}
            >
              {/* Timestamp */}
              <span className="text-desc shrink-0 text-[10px] select-none">[{ev.time}]</span>
              
              {/* Agent Tag */}
              <span className={`px-1.5 py-0.5 border text-[9px] uppercase tracking-wider rounded shrink-0 font-bold select-none ${getAgentColor(ev.agent)}`}>
                {ev.agent}
              </span>
              
              {/* Log Level Indicator */}
              <span className="text-[10px] font-bold select-none text-desc">
                {getLogTypeIcon(ev.type)}
              </span>

              {/* Message */}
              <span className="text-main text-xs font-sans">
                {ev.message}
              </span>
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
