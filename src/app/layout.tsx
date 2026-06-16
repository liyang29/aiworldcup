import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '世界杯 AI 预测竞技场',
  description:
    '让主流大模型在 2026 世界杯每场比赛赛前公开预测，按真实结果计分排名。你能赢过 GPT 吗？',
};

// 移动端优先（铁律6）
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
