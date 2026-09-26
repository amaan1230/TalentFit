/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#bae0ff',
          300: '#7cc2ff',
          400: '#369eff',
          500: '#007aff',
          600: '#005ed9',
          700: '#0047b3',
          800: '#003c93',
          900: '#063475',
          950: '#04204d',
        },
        slate: {
          850: '#141e33'
        }
      },
    },
  },
  plugins: [],
}
