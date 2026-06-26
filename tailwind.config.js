/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          light: '#132240',
          dark: '#060F1A',
        },
        ocean: {
          DEFAULT: '#0D7EA5',
          light: '#1299C5',
          dark: '#0A6080',
        },
        cyan: {
          biolum: '#00E5FF',
        },
        seafoam: '#B2EBF2',
        sandy: '#F5F0E8',
        coral: '#FF6B6B',
      },
      fontFamily: {
        heading: ['Nunito_700Bold'],
        body: ['Nunito_400Regular'],
        semibold: ['Nunito_600SemiBold'],
      },
    },
  },
  plugins: [],
};
