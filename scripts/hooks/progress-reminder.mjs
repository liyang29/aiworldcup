#!/usr/bin/env node
// PreToolUse hook：在 `git commit` 执行前，向 Claude 注入「核对进度表」提醒。
// 仅提醒，不拦截（不设置 permissionDecision，正常权限流程继续）。
// 输出协议见 Claude Code hooks：hookSpecificOutput.additionalContext

const reminder = [
  '【提交前提醒 · 进度表核对】',
  '在执行本次 git commit 之前，请先核对 docs/项目进度表.md：',
  '1. 把本次改动涉及的功能模块状态更新为 ✅ 已完成 / 🟡 进行中；',
  '2. 同步更新各阶段「完成度」计数与总览表；',
  '3. 在文末「最近更新日志」追加一行（日期 + 变更 + 涉及模块编号）；',
  '4. 若本次确实与任何模块无关（如改 typo / 调样式），可跳过，无需强行更新。',
  '完成核对后，把进度表的改动一并 git add 进本次提交，再继续。',
].join('\n');

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: reminder,
    },
  })
);
