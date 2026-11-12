/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B00',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          vivid: '#FF7A00',
        },
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          deep: '#4C1D95',
        },
        coral: {
          light: '#FFA8A8',
          DEFAULT: '#FF6B6B',
          dark: '#EE5253',
        },
        mint: {
          light: '#A8EDE5',
          DEFAULT: '#4ECDC4',
          dark: '#34A59D',
        },
        sky: {
          light: '#A1EAFB',
          DEFAULT: '#45B7D1',
          dark: '#2E89A4',
        },
        lavender: {
          light: '#B2ABDE',
          DEFAULT: '#786FA6',
          dark: '#574B90',
        },
        cream: '#FFFDF9',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        boggle: ['Fredoka', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'tile': '0 6px 0 0 rgba(0, 0, 0, 0.08), 0 10px 15px -3px rgba(0, 0, 0, 0.06)',
        'tile-active': '0 2px 0 0 rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'playful': '0 10px 30px -5px rgba(139, 92, 246, 0.25)',
      },
      animation: {
        'spin-slow': 'spin 6s linear infinite',
        'bounce-subtle': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
}
