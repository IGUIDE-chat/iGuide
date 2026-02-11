/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'illini-blue': '#13294B',
        'illini-orange': '#FF5F05',
      },
    },
  },
  plugins: [],
};
