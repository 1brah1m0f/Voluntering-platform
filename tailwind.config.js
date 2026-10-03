/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Headings and big numbers.
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      // Readability: the smallest sizes are a notch larger than Tailwind's defaults
      // (labels, chips and meta text were hard to read at 12px).
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.9375rem', { lineHeight: '1.4rem' }],
      },
      colors: {
        // App ground, body text and hairlines of the "paper" look.
        paper: '#f5f2ea',
        ink: '#0f2a2e',
        line: '#e4dfd3',
        // Secondary text in slate-400/500 was too faint; these are darker, still clearly "secondary".
        slate: {
          400: '#7d8a9e',
          500: '#566478',
        },
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
