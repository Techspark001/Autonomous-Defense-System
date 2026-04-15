/**
 * Glowing stat card for the summary bar at the top.
 */
export default function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div
      className="stat-card glow-border flex items-center gap-4 rounded-xl px-5 py-4"
      style={{ background: '#0d1224' }}
    >
      {/* Icon bubble */}
      <div
        className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg"
        style={{ background: `${color}18`, border: `1px solid ${color}40` }}
      >
        <Icon size={22} style={{ color }} />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4a5568' }}>
          {label}
        </p>
        <p className="text-2xl font-bold leading-tight font-mono" style={{ color }}>
          {value ?? '—'}
        </p>
        {subtext && (
          <p className="text-xs mt-0.5" style={{ color: '#4a5568' }}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}
