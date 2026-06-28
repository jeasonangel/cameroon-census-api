/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cameroon flag palette
        'cm-green': '#007a5e',
        'cm-green-dark': '#005a45',
        'cm-red': '#ce1126',
        'cm-red-dark': '#a00d1f',
        'cm-yellow': '#fcd116',
        'cm-yellow-dark': '#d9b212',
        'cm-ink': '#0a0f0d',
        'cm-panel': '#101815',
        'cm-line': '#1d2a25',
        'cm-muted': '#6b8079',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};