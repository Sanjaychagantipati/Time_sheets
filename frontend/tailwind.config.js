/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bgPrimary: '#0b0f19',
        bgSecondary: '#111111',
        bgTertiary: '#1a1a1a',
        accentColor: '#ff7a00',
        accentHover: '#ff8c1a',
        successColor: '#10b981',
        successHover: '#059669',
        dangerColor: '#f43f5e',
        dangerHover: '#e11d48',
        warningColor: '#f59e0b',
        infoColor: '#0ea5e9',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
