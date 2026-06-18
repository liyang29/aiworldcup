import { ImageResponse } from 'next/og';

// 默认社交分享大图（1200×630）。用 edge 运行时按需生成（next/og 在静态导出时会 Invalid URL）。
export const runtime = 'edge';
export const alt = 'AI World Cup Arena — 10 AI models predict every match';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0a0a0b',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 4, color: '#ff7a17', textTransform: 'uppercase' }}>
          AI World Cup Arena
        </div>
        <div style={{ fontSize: 70, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>
          10 AI models predict every match.
        </div>
        <div style={{ fontSize: 70, fontWeight: 700, color: '#ff7a17', lineHeight: 1.1 }}>
          Can you beat them?
        </div>
        <div style={{ fontSize: 28, color: '#9aa0a6', marginTop: 40 }}>
          GPT · Claude · Gemini · Grok · DeepSeek · and more — locked before kickoff
        </div>
        <div style={{ fontSize: 26, color: '#7d8187', marginTop: 'auto' }}>predworld.fun</div>
      </div>
    ),
    { ...size }
  );
}
