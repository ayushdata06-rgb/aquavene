/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aqua: {
          50: '#f0fdff',
          100: '#ccf7fe',
          200: '#99effe',
          300: '#66e6fd',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#0c2d3a',
        },
        hydro: {
          surface: '#0a1628',     // deep navy background
          card: '#0f1f35',        // card background
          panel: '#132540',       // panel background
          border: '#1e3a5a',      // border color
          accent: '#0ea5e9',      // primary blue accent
          success: '#22c55e',     // healthy/low risk
          warning: '#f59e0b',     // medium risk
          danger: '#ef4444',      // high/critical risk
          muted: '#64748b',       // secondary text
          subtle: '#334155',      // subtle borders
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'flow-pulse': 'flow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'data-shimmer': 'data-shimmer 2s linear infinite',
        'risk-pulse': 'risk-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'stream-flow': 'stream-flow 3s linear infinite',
        'counter-up': 'counter-up 0.5s ease-out',
        'chart-draw': 'chart-draw 0.8s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
        'watershed-draw': 'watershed-draw 1.2s ease-out forwards',
      },
      keyframes: {
        'flow-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scaleX(1)' },
          '50%': { opacity: '1', transform: 'scaleX(1.02)' },
        },
        'data-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'risk-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
        },
        'stream-flow': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        'counter-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'chart-draw': {
          from: { opacity: '0', transform: 'scaleY(0)', transformOrigin: 'bottom' },
          to: { opacity: '1', transform: 'scaleY(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'watershed-draw': {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
