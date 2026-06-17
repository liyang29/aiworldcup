import { IconTrophy, IconArrowRight } from '@tabler/icons-react';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col items-center justify-center gap-6 px-5 text-center">
      <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-mute">
        <IconTrophy size={16} stroke={1.5} /> AI World Cup
      </span>
      <h1 className="text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
        世界杯 AI 预测竞技场
      </h1>
      <p className="text-balance text-lg text-body">
        主流大模型在每场比赛
        <span className="text-sunset">赛前公开预测</span>
        ，按真实结果计分排名。
      </p>
      <p className="text-2xl font-medium text-sunset">你能赢过 GPT 吗？</p>
      <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-sunset px-5 py-2.5 text-sm font-medium text-canvas">
        和 AI 比一把 <IconArrowRight size={16} stroke={2} />
      </span>
      <p className="mt-4 text-sm text-mute">建设中 · 2026/06/28 淘汰赛前上线</p>
    </main>
  );
}
