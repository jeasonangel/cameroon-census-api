/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cameroon flag palette
        cm: {
          green: '#007a5e',
          'green-dark': '#005a45',
          red: '#ce1126',
          'red-dark': '#a00d1f',
          yellow: '#fcd116',
          'yellow-dark': '#d9b212',
          ink: '#0a0f0d',
          panel: '#101815',
          line: '#1d2a25',
          muted: '#6b8079',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
