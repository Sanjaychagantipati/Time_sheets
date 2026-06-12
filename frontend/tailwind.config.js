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
        bgSecondary: '#121826',
        bgTertiary: '#1a2336',
        accentColor: '#6366f1',
        accentHover: '#4f46e5',
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
