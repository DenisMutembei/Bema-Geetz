/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4A017',
          light: '#F5C842',
          dark: '#A07810',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          card: '#141414',
          border: '#2A2A2A',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Cormorant Garamond', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4A017 0%, #F5C842 50%, #D4A017 100%)',
      }
    },
  },
  plugins: [],
}
