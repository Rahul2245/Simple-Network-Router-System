/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090D14',
        darkCard: '#121822',
        accentGreen: '#00ffa3',
        statusGreen: '#2ecc71',
        statusYellow: '#f1c40f',
        statusRed: '#e74c3c'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
