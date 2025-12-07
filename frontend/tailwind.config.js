/** @type {import('tailwindcss').Config} */
export default {
  // We tell Tailwind where to look for class names
  // It scans these files and removes unused CSS in production
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
