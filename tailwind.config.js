/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-gold': '#B8860B',
        'brand-black': '#1A1A1A',
        'brand-cream': '#F5F0E8',
        'brand-beige': '#E8E0D5',
        'brand-grey': '#6B6B6B',
      },
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}