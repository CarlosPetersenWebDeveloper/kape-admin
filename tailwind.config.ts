import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kape: {
          green: '#0B6E4F',
          orange: '#E85D04',
          dark: '#0F172A',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
