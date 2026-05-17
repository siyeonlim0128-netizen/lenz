/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lenz: {
          blue: '#5B9BD5',
          'blue-light': '#A8C8E8',
          'blue-dark': '#2E6DA4',
          sky: '#D6E9F8',
          'gray-bg': '#F4F6F8',
          'gray-border': '#D0D7DE',
          'text-main': '#1A1A2E',
          'text-sub': '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

