import type { Config } from 'tailwindcss';

// 颜色基调：x.ai / Grok 暗色宇宙感（详见根目录 DESIGN.md、docs/设计规范.md）
const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0a0a0a',
        'canvas-soft': '#1a1c20',
        'canvas-card': '#191919',
        ink: '#ffffff',
        body: '#dadbdf',
        mute: '#7d8187',
        hairline: '#212327',
        sunset: '#ff7a17', // 强调·日落橙（第一名/CTA）
        dusk: '#7c3aed', // 强调·暮色紫
      },
      borderRadius: {
        card: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
