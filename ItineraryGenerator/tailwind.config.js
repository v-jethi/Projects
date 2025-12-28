/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tan-light': '#F5F1E8',
        'tan-lighter': '#F9F6F0',
        'tan-bg': '#F0EBE0',
      },
    },
  },
  plugins: [],
}

