// 模型头像：优先品牌 logo（白底圆形），无匹配时回退厂商色+缩写。
// 无 hooks，服务端/客户端组件都能用。

const LOGOS: { test: RegExp; src: string }[] = [
  { test: /grok/i, src: '/models/grok.svg' },
  { test: /deepseek/i, src: '/models/deepseek.svg' },
  { test: /qwen/i, src: '/models/qwen.svg' },
  { test: /glm/i, src: '/models/glm.svg' },
  { test: /kimi/i, src: '/models/kimi.svg' },
  { test: /llama/i, src: '/models/llama.svg' },
  { test: /mistral/i, src: '/models/mistral.svg' },
  { test: /gpt|openai/i, src: '/models/openai.svg' },
  { test: /claude/i, src: '/models/claude.svg' },
  { test: /gemini/i, src: '/models/gemini.svg' },
];

export const logoFor = (name?: string) => LOGOS.find((l) => l.test.test(name ?? ''))?.src ?? null;

const PROVIDER_COLOR: Record<string, string> = {
  xAI: '#6366f1',
  DeepSeek: '#2f6df6',
  Alibaba: '#7c3aed',
  Zhipu: '#0d9488',
  Moonshot: '#e0457b',
  Meta: '#1d9bf0',
  'Mistral AI': '#ff7a17',
  OpenAI: '#10a37f',
  Anthropic: '#d97757',
  Google: '#4285f4',
};

function initials(name: string) {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

export default function ModelAvatar({
  name,
  provider,
  size = 44,
}: {
  name?: string;
  provider?: string;
  size?: number;
}) {
  const src = logoFor(name);
  if (src) {
    return (
      <span
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name ?? ''} style={{ width: size * 0.62, height: size * 0.62 }} />
      </span>
    );
  }
  const color = PROVIDER_COLOR[provider ?? ''] ?? '#3a3d42';
  return (
    <span
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
    >
      {initials(name ?? '?')}
    </span>
  );
}
