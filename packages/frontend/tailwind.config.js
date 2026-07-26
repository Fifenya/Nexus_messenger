/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexus: {
          indigo: '#5B6ABF',
          dark: '#1A1A2E',
          light: '#E2E2E2',
        },
      },
      borderRadius: {
        'nexus-own': '16px 16px 16px 0',
        'nexus-other': '16px 16px 0 16px',
      },
    },
  },
  plugins: [],
};