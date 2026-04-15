import { getSeverityConfig } from '../severity'

export default function SeverityBadge({ severity }) {
  const cfg = getSeverityConfig(severity)
  return (
    <span
      className="severity-pill"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span style={{ color: cfg.dot }}>{cfg.glyph}</span>
      {cfg.label}
    </span>
  )
}
