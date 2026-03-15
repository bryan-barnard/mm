import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        accent: '#16a34a'
      }
    }
  },
  plugins: []
};

export default config;
