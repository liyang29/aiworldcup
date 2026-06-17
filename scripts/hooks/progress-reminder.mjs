#!/usr/bin/env node
// PreToolUse hook：在 `git commit` 执行前，向 Claude 注入「核对进度表」提醒。
// 仅提醒，不拦截（不设置 permissionDecision，正常权限流程继续）。
// 输出协议见 Claude Code hooks：hookSpecificOutput.additionalContext
//
// 自带命令判断：只在命令确为 git commit 时才提醒（settings.json 的 if 过滤
// 在部分环境不生效，这里读 stdin 自行判断，双保险，避免在普通 Bash 上误触发）。

const readStdin = () =>
  new Promise((resolve) => {
    let s = '';
    process.stdin.on('data', (c) => (s += c));
    process.stdin.on('end', () => resolve(s));
    setTimeout(() => resolve(s), 200); // 容错：无 stdin 时不卡住
  });

const input = await readStdin();
let command = '';
try {
  command = JSON.parse(input || '{}')?.tool_input?.command || '';
} catch {
  command = '';
}

// 只匹配真正的 git commit（排除 git log --commit 之类的误伤）
const isGitCommit = /\bgit\s+(-[^\s]+\s+)*commit\b/.test(command);
if (!isGitCommit) process.exit(0); // 非 commit：静默退出，不提醒

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
