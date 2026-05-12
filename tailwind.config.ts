import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F0E4D8',
        surface: '#E8D3BF',
        'surface-el': '#D8C7B5',
        'surface-ov': '#CDBBAD',
        border: '#C4B09A',
        foreground: '#2F241C',
        orange: {
          DEFAULT: '#E26402',
          dark: '#C55602',
          light: '#F07820',
        },
        success: '#15803d',
        danger: '#C62828',
        muted: '#6E5F54',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '390px',
      },
    },
  },
  plugins: [],
};

export default config;
