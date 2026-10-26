/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        neon: '0 0 25px rgba(6, 182, 212, 0.5)',
        purple: '0 0 35px rgba(124, 58, 237, 0.35)'
      },
      colors: {
        codestay: {
          primary: '#7c3aed',
          secondary: '#06b6d4',
          dark: '#0f172a',
          panel: '#111827',
          text: '#e2e8f0'
        }
      }
    }
  },
  plugins: []
};
