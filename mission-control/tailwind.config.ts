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
        // ClawHealth dark medical theme
        'mc-bg': '#0a0e14',
        'mc-bg-secondary': '#111822',
        'mc-bg-tertiary': '#1a2332',
        'mc-border': '#243044',
        'mc-text': '#d0d8e4',
        'mc-text-secondary': '#7a8ba0',
        'mc-accent': '#4da6ff',
        'mc-accent-green': '#00d68f',
        'mc-accent-yellow': '#ffaa00',
        'mc-accent-red': '#ff4757',
        'mc-accent-purple': '#a78bfa',
        'mc-accent-pink': '#f472b6',
        'mc-accent-cyan': '#22d3ee',
        // ClawHealth brand colors
        'ch-primary': '#4da6ff',
        'ch-secondary': '#00d68f',
        'ch-cardio': '#ff6b6b',
        'ch-pulse': '#22d3ee',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
