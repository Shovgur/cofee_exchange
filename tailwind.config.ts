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
        bg: '#0E0E0E',
        surface: '#1A1A1A',
        'surface-el': '#242424',
        'surface-ov': '#2E2E2E',
        border: '#2E2E2E',
        orange: {
          DEFAULT: '#FF6B35',
          dark: '#E55525',
          light: '#FF8C5A',
        },
        success: '#22C55E',
        danger: '#EF4444',
        muted: '#888888',
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
