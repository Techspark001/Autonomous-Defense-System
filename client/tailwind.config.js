/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:      '#0a0e1a',
          panel:   '#0d1224',
          border:  '#1a2540',
          accent:  '#00d4ff',
          green:   '#00ff88',
          yellow:  '#ffcc00',
          orange:  '#ff7a00',
          red:     '#ff2c55',
          muted:   '#4a5568',
          text:    '#c9d1e6',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.4s ease-in-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'scan':       'scan 4s linear infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateY(-8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          from: { textShadow: '0 0 6px #00d4ff, 0 0 12px #00d4ff' },
          to:   { textShadow: '0 0 12px #00d4ff, 0 0 24px #00d4ff, 0 0 36px #00d4ff' },
        },
      },
    },
  },
  plugins: [],
}
