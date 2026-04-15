import { useRef, useEffect, useState } from 'react'
import SeverityBadge from './SeverityBadge'
import { getSeverityConfig } from '../severity'
import { ChevronUp, ChevronDown, Brain } from 'lucide-react'

const COLUMNS = [
  { key: 'created_at', label: 'Time',        width: '120px' },
  { key: 'severity',   label: 'Severity',    width: '100px' },
  { key: 'event_type', label: 'Event Type',  width: '150px' },
  { key: 'exploitability_score', label: 'Risk', width: '80px' },
  { key: 'mitigation_strategy', label: 'Strategy', width: '100px' },
  { key: 'source_ip',  label: 'Source IP',   width: '130px' },
  { key: 'description', label: 'Description', width: 'auto' },
]

function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ChevronUp size={12} style={{ opacity: 0.2 }} />
  return sortDir === 'asc'
    ? <ChevronUp size={12} style={{ color: '#00d4ff' }} />
    : <ChevronDown size={12} style={{ color: '#00d4ff' }} />
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', { hour12: false }) + '.' +
      String(d.getMilliseconds()).padStart(3, '0')
  } catch { return iso }
}

function SkeletonRow() {
  return (
    <tr>
      {COLUMNS.map(col => (
        <td key={col.key} style={{ padding: '12px 16px' }}>
          <div className="shimmer rounded h-4" style={{ width: col.key === 'description' ? '80%' : '70%' }} />
        </td>
      ))}
    </tr>
  )
}

export default function ThreatTable({ logs, loading, newIds, onSelectLog }) {
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [filter, setFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const tableBodyRef = useRef(null)

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // Filter + sort
  const filtered = logs
    .filter(log => {
      if (!log) return false
      const severity = (log?.severity || '').toLowerCase()
      if (severityFilter !== 'all' && severity !== severityFilter) return false
      if (!filter) return true
      const q = filter.toLowerCase()
      return (
        (log?.event_type || '').toLowerCase().includes(q) ||
        (log?.source_ip || '').includes(q) ||
        (log?.destination_ip || '').includes(q) ||
        (log?.description || '').toLowerCase().includes(q) ||
        severity.includes(q)
      )
    })
    .sort((a, b) => {
      let va = a?.[sortKey] ?? ''
      let vb = b?.[sortKey] ?? ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low', 'info']
  const severityColors = {
    all: '#00d4ff', critical: '#ff2c55', high: '#ff7a00',
    medium: '#ffcc00', low: '#00ff88', info: '#00d4ff',
  }

  return (
    <div
      className="glow-border rounded-xl overflow-hidden flex flex-col"
      style={{ background: '#0d1224', minHeight: 0 }}
    >
      {/* Table toolbar */}
      <div
        className="flex items-center gap-3 px-5 py-3 flex-wrap"
        style={{ borderBottom: '1px solid #1a2540' }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#4a5568" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search threats..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: '#0a0e1a',
              border: '1px solid #1a2540',
              color: '#c9d1e6',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </div>

        {/* Severity filter pills */}
        <div className="flex gap-1 flex-wrap">
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider transition-all"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                background: severityFilter === s ? `${severityColors[s]}22` : 'transparent',
                border: `1px solid ${severityFilter === s ? severityColors[s] : '#1a2540'}`,
                color: severityFilter === s ? severityColors[s] : '#4a5568',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="text-xs ml-auto" style={{ color: '#4a5568', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1" style={{ maxHeight: '520px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: '#080c18' }}>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    width: col.width,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: sortKey === col.key ? '#00d4ff' : '#4a5568',
                    borderBottom: '1px solid #1a2540',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody ref={tableBodyRef}>
            {loading && logs.length === 0
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ color: '#4a5568', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⊘</div>
                      No threats matching filter
                    </div>
                  </td>
                </tr>
              )
              : filtered.map((log, idx) => {
                const cfg = getSeverityConfig(log.severity)
                const isNew = newIds.has(log.id)
                return (
                  <tr
                    key={log?.id ?? idx}
                    className={`threat-row ${isNew ? 'new-row' : ''}`}
                    onClick={() => onSelectLog(log)}
                    style={{
                      borderBottom: '1px solid #0f1525',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Time */}
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#4a5568' }}>
                        {formatTime(log?.created_at)}
                      </span>
                    </td>

                    {/* Severity */}
                    <td style={{ padding: '11px 16px' }}>
                      <SeverityBadge severity={log?.severity} />
                    </td>

                    {/* Event type */}
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.8rem',
                        color: '#c9d1e6',
                        background: 'rgba(0,212,255,0.06)',
                        border: '1px solid rgba(0,212,255,0.1)',
                        borderRadius: '4px',
                        padding: '2px 7px',
                      }}>
                        {log?.event_type || '—'}
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td style={{ padding: '11px 16px' }}>
                      {typeof log?.exploitability_score === 'number' ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: log.exploitability_score > 8 ? '#ff2c55' : log.exploitability_score > 5 ? '#ff7a00' : '#00ff88' }} />
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 'bold', color: log.exploitability_score > 8 ? '#ff2c55' : log.exploitability_score > 5 ? '#ff7a00' : '#00ff88' }}>
                                {log.exploitability_score.toFixed(1)}
                            </span>
                        </div>
                      ) : (
                        <span style={{ color: '#1a2540' }}>—</span>
                      )}
                    </td>

                    {/* Strategy */}
                    <td style={{ padding: '11px 16px' }}>
                        <span style={{ 
                            fontFamily: 'JetBrains Mono, monospace', 
                            fontSize: '0.7rem', 
                            fontWeight: 'bold',
                            color: log?.mitigation_strategy === 'BLOCK' ? '#ff2c55' : log?.mitigation_strategy === 'ISOLATE' ? '#ff7a00' : '#00d4ff',
                            border: `1px solid ${log?.mitigation_strategy === 'BLOCK' ? '#ff2c5540' : log?.mitigation_strategy === 'ISOLATE' ? '#ff7a0040' : '#00d4ff40'}`,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: `${log?.mitigation_strategy === 'BLOCK' ? '#ff2c5510' : log?.mitigation_strategy === 'ISOLATE' ? '#ff7a0010' : '#00d4ff10'}`
                        }}>
                             {log?.mitigation_strategy || 'MONITOR'}
                        </span>
                    </td>

                    {/* Source IP */}
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: log?.source_ip ? cfg.color : '#4a5568' }}>
                        {log?.source_ip || '—'}
                      </span>
                    </td>

                    {/* Description */}
                    <td style={{ padding: '11px 16px', maxWidth: '320px' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span style={{ fontSize: '0.82rem', color: '#8899aa', lineHeight: 1.4 }}>
                            {log?.description || '—'}
                        </span>
                        {log?.thought_trace && (
                            <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                                <Brain size={12} />
                            </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
