/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#effbfb',
          100: '#d5f3f3',
          200: '#afe6e7',
          300: '#78d2d5',
          400: '#3ab4bb',
          500: '#1f98a1',
          600: '#1b7a85',
          700: '#1b626c',
          800: '#1c515a',
          900: '#0f3a42',
          950: '#082a31',
        },
        coral: {
          50: '#fff4f1',
          100: '#ffe6df',
          200: '#ffd0c4',
          300: '#ffae9b',
          400: '#ff8063',
          500: '#fb5d3b',
          600: '#e8431f',
          700: '#c33416',
          800: '#a12e17',
          900: '#852c1a',
        },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(15, 58, 66, 0.18)',
        card: '0 2px 10px -2px rgba(15, 58, 66, 0.08), 0 8px 24px -8px rgba(15, 58, 66, 0.10)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.08)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
