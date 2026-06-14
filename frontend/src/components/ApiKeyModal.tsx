import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, AlertTriangle, Cpu, Loader2, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: (status: any) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onVerifySuccess }: ApiKeyModalProps) {
  const [groqKey, setGroqKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to read current API statuses on load
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/auth/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Error fetching key status', err);
      }
    };
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groq_api_key: groqKey,
          mistral_api_key: mistralKey
        })
      });

      if (!response.ok) {
        throw new Error('Verification network request failed.');
      }

      const data = await response.json();
      setStatus(data);
      onVerifySuccess(data);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Falling back to Demo Mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl relative overflow-hidden font-console glow-border-cyan">
        {/* Futuristic scanline */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/30 animate-scanline" />

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-cyan-400" />
            <h2 className="text-cyan-400 uppercase tracking-widest text-sm font-bold">API KEY CONFIGURATION</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-300 text-xs border border-slate-800 px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded transition"
          >
            ESC // CLOSE
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleVerify} className="p-6 space-y-6">
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Enter your API credentials to operationalize ASTRA Rail's Agentic AI models. If keys are unavailable or fail validation, the system automatically redirects to <span className="text-amber-400 font-console">Demo AI Mode</span> using local simulated monologues.
          </p>

          <div className="space-y-4">
            {/* Groq Key Input */}
            <div className="space-y-1">
              <label className="block text-xs uppercase text-slate-400 tracking-wider">GROQ API KEY</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>
            </div>

            {/* Mistral Key Input */}
            <div className="space-y-1">
              <label className="block text-xs uppercase text-slate-400 tracking-wider">MISTRAL API KEY</label>
              <div className="relative">
                <input
                  type="password"
                  value={mistralKey}
                  onChange={(e) => setMistralKey(e.target.value)}
                  placeholder="Enter Mistral API Key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Connection Indicators */}
          {status && (
            <div className="bg-slate-950 p-4 border border-slate-800 rounded space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider">GROQ ENGINE STATUS:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.groq_connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'}`} />
                  <span className={status.groq_connected ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                    {status.groq_connected ? 'CONNECTED' : 'DEMO MODE'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider">MISTRAL ENGINE STATUS:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.mistral_connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'}`} />
                  <span className={status.mistral_connected ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                    {status.mistral_connected ? 'CONNECTED' : 'DEMO MODE'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/60 mt-2 pt-2 flex items-center gap-2 text-slate-500 text-[10px]">
                <Cpu className="w-3.5 h-3.5" />
                <span>INTELLIGENCE MATRIX: {status.demo_mode ? 'LOCAL AGENT SIMULATOR (DETERMINISTIC)' : 'LIVE LLM COGNITIVE ROUTING'}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-400 text-xs rounded flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-cyan-950 border border-cyan-800 text-cyan-400 py-2 rounded text-xs uppercase tracking-wider hover:bg-cyan-900 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>VERIFYING CAPABILITIES...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>AUTHENTICATE & SECURE</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus({
                  groq_connected: false,
                  mistral_connected: false,
                  demo_mode: true
                });
                onVerifySuccess({
                  groq_connected: false,
                  mistral_connected: false,
                  demo_mode: true
                });
                onClose();
              }}
              className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider hover:bg-slate-800 rounded transition"
            >
              USE DEMO MODE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
