import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Shield, AlertTriangle, Wifi, Activity, RefreshCw,
  Zap, Eye, Clock, ShieldAlert, Brain
} from 'lucide-react'
import StatCard from './components/StatCard'
import ThreatTable from './components/ThreatTable'
import ThoughtTracePanel from './components/ThoughtTracePanel'
import { fetchThreats, postThreat } from './api'
import { SEVERITY_CONFIG } from './severity'

const POLL_INTERVAL = 5000 // 5 seconds

const DEMO_EVENTS = [
  { event_type: 'SQL_INJECTION', severity: 'critical', source_ip: '203.0.113.42', destination_ip: '10.0.0.5', description: 'Attempted SQL injection on /api/login' },
  { event_type: 'BRUTE_FORCE', severity: 'high', source_ip: '198.51.100.7', destination_ip: '10.0.0.1', description: 'Multiple failed SSH login attempts detected' },
  { event_type: 'PORT_SCAN', severity: 'medium', source_ip: '192.0.2.15', destination_ip: '10.0.0.0/24', description: 'SYN scan across subnet detected' },
  { event_type: 'DATA_EXFIL', severity: 'critical', source_ip: '10.0.0.22', destination_ip: '185.220.101.8', description: 'Unusual outbound data transfer to Tor exit node' },
  { event_type: 'XSS_ATTEMPT', severity: 'medium', source_ip: '203.0.113.99', destination_ip: '10.0.0.5', description: 'Reflected XSS payload in request parameter' },
  { event_type: 'MALWARE_DETECTED', severity: 'critical', source_ip: '10.0.0.44', destination_ip: null, description: 'Ransomware signature in uploaded file' },
  { event_type: 'AUTH_ANOMALY', severity: 'high', source_ip: '89.248.172.0', destination_ip: '10.0.0.1', description: 'Login from unusual geographic location' },
  { event_type: 'DNS_TUNNELING', severity: 'high', source_ip: '10.0.0.30', destination_ip: '8.8.8.8', description: 'Suspicious DNS TXT record queries indicating tunneling' },
  { event_type: 'PRIVILEGE_ESC', severity: 'critical', source_ip: '10.0.0.15', destination_ip: null, description: 'sudo privilege escalation attempt by non-admin user' },
  { event_type: 'FIREWALL_BYPASS', severity: 'high', source_ip: '45.33.32.156', destination_ip: '10.0.0.2', description: 'Traffic on blocked port via protocol tunneling' },
]

function LiveIndicator({ active }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="pulse-dot"
        style={{
          background: active ? '#00ff88' : '#4a5568',
          boxShadow: active ? '0 0 6px #00ff88, 0 0 12px #00ff88' : 'none',
          animation: active ? 'pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
        }}
      />
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: active ? '#00ff88' : '#4a5568', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {active ? 'Live' : 'Paused'}
      </span>
    </div>
  )
}

function CountdownRing({ progress }) {
  const r = 10
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - progress)
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="14" cy="14" r={r} fill="none" stroke="#1a2540" strokeWidth="2.5" />
      <circle
        cx="14" cy="14" r={r}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s linear' }}
      />
    </svg>
  )
}

export default function App() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paused, setPaused] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [newIds, setNewIds] = useState(new Set())
  const [countdown, setCountdown] = useState(1)  // 0→1
  const [seeding, setSeeding] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)

  const knownIdsRef = useRef(new Set())
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const countdownStartRef = useRef(Date.now())

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const poll = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const data = await fetchThreats(100)
      const dataArr = Array.isArray(data) ? data : []
      setLogs(dataArr)

      // Detect newly arrived ids
      const fresh = new Set()
      dataArr.forEach(log => {
        if (log?.id && !knownIdsRef.current.has(log.id)) {
          fresh.add(log.id)
        }
      })
      if (fresh.size > 0) {
        setNewIds(fresh)
        setTimeout(() => setNewIds(new Set()), 2000)
      }
      // Update known ids
      knownIdsRef.current = new Set(dataArr.map(l => l?.id))
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message ?? 'Failed to fetch threat data')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    poll(true)
  }, [poll])

  useEffect(() => {
    if (paused) {
      clearInterval(timerRef.current)
      clearInterval(countdownRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      poll()
      countdownStartRef.current = Date.now()
    }, POLL_INTERVAL)

    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - countdownStartRef.current
      setCountdown(elapsed / POLL_INTERVAL)
    }, 100)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [paused, poll])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const logsArr = Array.isArray(logs) ? logs : []
  const severityCounts = logsArr.reduce((acc, l) => {
    const k = (l?.severity ?? 'info').toLowerCase()
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  const uniqueIPs = new Set(logsArr.map(l => l?.source_ip).filter(Boolean)).size
  const actionableCount = logsArr.filter(l => l?.is_actionable).length

  // ── Seed demo event ────────────────────────────────────────────────────────
  async function seedDemo() {
    setSeeding(true)
    const evt = DEMO_EVENTS[Math.floor(Math.random() * DEMO_EVENTS.length)]
    try {
      await postThreat({ ...evt, timestamp: new Date().toISOString() })
      await poll()
    } catch (e) {
      setError('Failed to seed demo event: ' + e.message)
    } finally {
      setSeeding(false)
    }
  }

  // ── Formatted last-updated ─────────────────────────────────────────────────
  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-GB', { hour12: false })
    : null

  return (
    <div
      className="min-h-screen grid-overlay scanline"
      style={{ background: '#0a0e1a' }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: 'rgba(13,18,36,0.9)',
          borderBottom: '1px solid #1a2540',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              <Shield size={22} style={{ color: '#00d4ff' }} />
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-wide"
                style={{ color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}
              >
                ThreatWatch
              </h1>
              <p className="text-xs" style={{ color: '#4a5568', lineHeight: 1, marginTop: '2px' }}>
                Security Command Center
              </p>
            </div>
          </div>

          {/* Center: system status */}
          <div className="flex-1 flex justify-center">
            <div
              className="hidden md:flex items-center gap-6 px-6 py-2 rounded-full"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1a2540' }}
            >
              {[
                { label: 'SYSTEM', value: 'ONLINE', color: '#00ff88' },
                { label: 'IDS', value: 'ACTIVE', color: '#00ff88' },
                { label: 'FIREWALL', value: 'ARMED', color: '#00ff88' },
                { label: 'THREAT LEVEL', value: (severityCounts?.critical || 0) > 0 ? 'CRITICAL' : (severityCounts?.high || 0) > 0 ? 'ELEVATED' : 'NOMINAL', color: (severityCounts?.critical || 0) > 0 ? '#ff2c55' : (severityCounts?.high || 0) > 0 ? '#ff7a00' : '#00ff88' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: '#4a5568' }}>{item.label}</span>
                  <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 ml-auto">
            <LiveIndicator active={!paused} />

            <CountdownRing progress={countdown} />

            <button
              onClick={() => setPaused(p => !p)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: paused ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${paused ? 'rgba(0,212,255,0.4)' : '#1a2540'}`,
                color: paused ? '#00d4ff' : '#4a5568',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {paused ? <Eye size={14} /> : <Clock size={14} />}
              {paused ? 'Resume' : 'Pause'}
            </button>

            <button
              onClick={() => poll(false)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00d4ff',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button
              onClick={seedDemo}
              disabled={seeding}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: seeding ? 'rgba(255,44,85,0.06)' : 'rgba(255,44,85,0.1)',
                border: '1px solid rgba(255,44,85,0.3)',
                color: '#ff2c55',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <Zap size={14} />
              {seeding ? 'Seeding…' : 'Demo Event'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* Error banner */}
        {error && (
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-xl text-sm animate-fade-in"
            style={{
              background: 'rgba(255,44,85,0.08)',
              border: '1px solid rgba(255,44,85,0.3)',
              color: '#ff6680',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <ShieldAlert size={18} style={{ color: '#ff2c55', flexShrink: 0 }} />
            <span><strong style={{ color: '#ff2c55' }}>API Error</strong> — {error}</span>
          </div>
        )}

        {/* ── Stat bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            icon={Activity}
            label="Total Events"
            value={logsArr.length}
            color="#00d4ff"
            subtext={updatedStr ? `Updated ${updatedStr}` : 'Connecting…'}
          />
          <StatCard
            icon={AlertTriangle}
            label="Critical"
            value={severityCounts.critical ?? 0}
            color="#ff2c55"
            subtext="Immediate action"
          />
          <StatCard
            icon={ShieldAlert}
            label="High"
            value={severityCounts.high ?? 0}
            color="#ff7a00"
            subtext="Investigate now"
          />
          <StatCard
            icon={Wifi}
            label="Unique Sources"
            value={uniqueIPs}
            color="#ffcc00"
            subtext="Distinct IPs"
          />
          <StatCard
            icon={Brain}
            label="Actionable"
            value={actionableCount}
            color="#ff2c55"
            subtext="Immediate Mitigation"
          />
          <StatCard
            icon={Shield}
            label="Monitored"
            value={Math.max(0, (logsArr?.length || 0) - (actionableCount || 0))}
            color="#00ff88"
            subtext="Standard Priority"
          />
        </div>

        {/* Reasoning Agent Panel */}
        <ThoughtTracePanel log={selectedLog} />

        {/* ── Threat table ── */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: '#c9d1e6', fontFamily: 'JetBrains Mono, monospace' }}
            >
              ▸ Threat Monitor
            </h2>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #1a2540, transparent)' }} />
            <span
              className="text-xs"
              style={{ color: '#4a5568', fontFamily: 'JetBrains Mono, monospace' }}
            >
              Auto-refresh every {POLL_INTERVAL / 1000}s
            </span>
          </div>

          <ThreatTable logs={logsArr} loading={loading} newIds={newIds} onSelectLog={setSelectedLog} />
        </div>

        {/* Footer */}
        <footer className="text-center pb-4">
          <p style={{ fontSize: '0.7rem', color: '#1a2540', fontFamily: 'JetBrains Mono, monospace' }}>
            ThreatWatch v1.0 · Powered by Supabase · {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  )
}
