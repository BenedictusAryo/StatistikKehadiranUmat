/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        church: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16',
        },
        liturgy: {
          gold: '#d97706',
          goldLight: '#fef3c7',
          goldDark: '#b45309',
          green: '#15803d',
          greenLight: '#dcfce7',
          red: '#b91c1c',
          redLight: '#fee2e2',
          purple: '#6b21a8',
          purpleLight: '#f3e8ff',
          blue: '#1d4ed8',
          blueLight: '#dbeafe',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.3)',
        'glow-gold': '0 0 25px -5px rgba(217, 119, 6, 0.3)',
      }
    },
  },
  plugins: [],
}
