/**
 * Maps severity string → display config
 */
export const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: '#ff2c55',
    bg: 'rgba(255,44,85,0.12)',
    border: 'rgba(255,44,85,0.35)',
    dot: '#ff2c55',
    glyph: '◈',
  },
  high: {
    label: 'High',
    color: '#ff7a00',
    bg: 'rgba(255,122,0,0.12)',
    border: 'rgba(255,122,0,0.35)',
    dot: '#ff7a00',
    glyph: '◆',
  },
  medium: {
    label: 'Medium',
    color: '#ffcc00',
    bg: 'rgba(255,204,0,0.12)',
    border: 'rgba(255,204,0,0.35)',
    dot: '#ffcc00',
    glyph: '◇',
  },
  low: {
    label: 'Low',
    color: '#00ff88',
    bg: 'rgba(0,255,136,0.09)',
    border: 'rgba(0,255,136,0.3)',
    dot: '#00ff88',
    glyph: '○',
  },
  info: {
    label: 'Info',
    color: '#00d4ff',
    bg: 'rgba(0,212,255,0.09)',
    border: 'rgba(0,212,255,0.3)',
    dot: '#00d4ff',
    glyph: '●',
  },
}

export function getSeverityConfig(severity) {
  const key = (severity || 'info').toLowerCase()
  return SEVERITY_CONFIG[key] ?? SEVERITY_CONFIG.info
}
