import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pitch: '#0b6e3a', // 球场绿
        accent: '#f5c518', // 奖杯金
      },
    },
  },
  plugins: [],
};

export default config;
