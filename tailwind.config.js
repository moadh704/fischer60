/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#141414',
          darker: '#0a0a0a',
          panel: '#161616',
          gold: '#d4af37',
          'gold-dim': '#c9a227',
          'gold-light': '#f0d78c',
          board: '#312e2b',
          green: '#779952',
          cream: '#ebecd0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 30px -8px rgba(212, 175, 55, 0.25)',
      }
    },
  },
  plugins: [],
}
