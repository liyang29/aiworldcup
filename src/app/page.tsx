export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col items-center justify-center gap-6 px-5 text-center">
      <span className="text-5xl">🏆⚽</span>
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
        世界杯 AI 预测竞技场
      </h1>
      <p className="text-balance text-lg text-neutral-300">
        主流大模型在每场比赛<strong className="text-accent">赛前公开预测</strong>，
        按真实结果计分排名。
      </p>
      <p className="text-2xl font-semibold text-accent">你能赢过 GPT 吗？</p>
      <p className="mt-8 text-sm text-neutral-500">
        🚧 建设中 · 2026/06/28 淘汰赛前上线
      </p>
    </main>
  );
}
