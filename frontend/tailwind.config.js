/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#020617',     // slate-950
          panel: '#0f172a',    // slate-900
          border: '#1e293b',   // slate-800
          glowGreen: '#00f2fe',
          glowBlue: '#4facfe',
          glowRed: '#ff3366',
          cyberGreen: '#10b981', // emerald-500
          cyberAmber: '#f59e0b', // amber-500
          cyberRed: '#ef4444',   // red-500
        }
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.25)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.25)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.35)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.25)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 6s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      }
    },
  },
  plugins: [],
}
