/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f5ee',
          100: '#c3e6d2',
          200: '#9bd5b4',
          300: '#6dc495',
          400: '#3eaf77',
          500: '#1f9a60',
          600: '#16794a',
          700: '#0f5a36',
          800: '#0a3d24',
          900: '#062616',
          950: '#041a0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
