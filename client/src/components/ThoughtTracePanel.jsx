import React from 'react'
import { Brain, Activity, ShieldCheck } from 'lucide-react'

export default function ThoughtTracePanel({ log }) {
  if (!log) {
    return (
      <div 
        className="glow-border rounded-xl p-8 flex flex-col items-center justify-center text-center animate-fade-in"
        style={{ background: '#0d1224', minHeight: '200px' }}
      >
        <Brain size={48} className="mb-4 opacity-10" style={{ color: '#00d4ff' }} />
        <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: '#4a5568', fontFamily: 'JetBrains Mono, monospace' }}>
          No Active Reasoning
        </p>
        <p className="text-xs max-w-xs" style={{ color: '#2d3748' }}>
          Select a threat from the monitor to view the Reasoning Agent's internal logic and strategic assessment.
        </p>
      </div>
    )
  }

  // Fallback if thought_trace is null (Agent still working)
  if (!log?.thought_trace) {
    return (
      <div 
        className="glow-border rounded-xl p-10 flex flex-col items-center justify-center text-center animate-fade-in"
        style={{ background: '#0d1224', minHeight: '240px', border: '1px solid #1a2540' }}
      >
        <div className="relative mb-6">
            <Brain size={56} className="opacity-20 animate-pulse" style={{ color: '#00d4ff' }} />
            <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={24} className="animate-bounce" style={{ color: '#00ff88' }} />
            </div>
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace' }}>
          Agent Analysis In Progress...
        </p>
        <p className="text-xs max-w-sm italic opacity-60" style={{ color: '#c9d1e6' }}>
          PHAROS Intelligence agents are currently executing reconnaissance scans and mapping vulnerabilities to tactical signatures.
        </p>
      </div>
    )
  }

  const steps = log?.reasoning_steps || []
  const score = log?.exploitability_score || 0
  const strategy = log?.mitigation_strategy || 'MONITOR'
  
  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return '#ff2c55';
      case 'high': return '#ff7a00';
      case 'medium': return '#ffcc00';
      case 'low': return '#00ff88';
      default: return '#00d4ff';
    }
  }

  return (
    <div 
      className="glow-border rounded-xl flex flex-col lg:flex-row gap-6 p-6 animate-fade-in"
      style={{ background: '#0d1224', border: '1px solid #1a2540' }}
    >
      {/* Risk Metrics */}
      <div className="flex flex-col gap-4 lg:w-1/3">
        <div className="flex items-center gap-2 mb-2">
            <Brain size={18} style={{ color: '#00d4ff' }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace' }}>
                Reasoning Agent Results
            </h2>
        </div>

        {/* Score Gauge */}
        <div className="flex flex-col items-center justify-center p-6 rounded-xl relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1a2540' }}>
            <div className="text-4xl font-black mb-1" style={{ 
                color: score > 8 ? '#ff2c55' : score > 5 ? '#ff7a00' : '#00ff88',
                fontFamily: 'JetBrains Mono, monospace',
                textShadow: `0 0 20px ${score > 8 ? '#ff2c55' : score > 5 ? '#ff7a00' : '#00ff88'}40`
            }}>
                {typeof score === 'number' ? score.toFixed(1) : '—'}
            </div>
            <div className="text-[0.6rem] uppercase tracking-tighter font-bold" style={{ color: '#4a5568' }}>
                Exploitability Score
            </div>
            
            {/* Progress line */}
            <div className="w-full h-1 bg-[#1a2540] rounded-full mt-4 overflow-hidden">
                <div 
                    className="h-full transition-all duration-1000" 
                    style={{ 
                        width: `${score * 10}%`, 
                        background: `linear-gradient(90deg, #00ff88, #ffcc00, #ff2c55)`,
                        boxShadow: '0 0 10px rgba(255,44,85,0.3)'
                    }} 
                />
            </div>
        </div>

        {/* Status Blocks */}
        <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg flex flex-col gap-1" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1a2540' }}>
                <div className="text-[0.6rem] uppercase font-bold text-[#4a5568]">Actionable</div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${log?.is_actionable ? 'animate-pulse' : ''}`} style={{ background: log?.is_actionable ? '#ff2c55' : '#4a5568' }} />
                    <span className="text-xs font-bold" style={{ color: log?.is_actionable ? '#f5f5f5' : '#4a5568' }}>{log?.is_actionable ? 'YES' : 'NO'}</span>
                </div>
            </div>
            <div className="p-3 rounded-lg flex flex-col gap-1" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1a2540' }}>
                <div className="text-[0.6rem] uppercase font-bold text-[#4a5568]">Strategy</div>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={12} style={{ color: '#00d4ff' }} />
                    <span className="text-xs font-bold" style={{ color: '#00d4ff' }}>{strategy}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Thought Trace Timeline */}
      <div className="flex-1 flex flex-col gap-4">
        <h3 className="text-[0.7rem] font-bold uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: '#4a5568', fontFamily: 'JetBrains Mono, monospace' }}>
            <Activity size={14} /> Internal Thought Trace
        </h3>
        
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div 
                key={idx} 
                className="flex gap-4 group animate-slide-up"
                style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="flex flex-col items-center">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold transition-all group-hover:scale-110" 
                  style={{ 
                    background: 'rgba(0,212,255,0.1)', 
                    border: `1px solid ${getSeverityColor(step?.severity)}60`,
                    color: getSeverityColor(step?.severity)
                  }}
                >
                  {step?.step || idx + 1}
                </div>
                {idx !== steps.length - 1 && (
                  <div className="w-px flex-1 my-1" style={{ background: 'linear-gradient(180deg, #1a2540, transparent)' }} />
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div 
                  className="p-3 rounded-lg transition-all group-hover:translate-x-1" 
                  style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    border: `1px solid ${getSeverityColor(step?.severity)}10` 
                  }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: '#c9d1e6', fontFamily: 'Inter, sans-serif' }}>
                    {step?.text || 'Analysis pending...'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {steps.length === 0 && (
             <div className="text-xs italic opacity-40 text-center py-4">
                Structured reasoning steps unavailable.
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
