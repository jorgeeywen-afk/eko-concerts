/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        bg:    '#f5efe4',
        paper: '#faf5ea',
        ink:   '#3a2e24',
        'ink-2': '#7a6a5a',
        accent: '#c2674a',
        'accent-soft': 'rgba(194,103,74,0.15)',
        border: '#ddd5c8',
      },
    },
  },
  plugins: [],
};
