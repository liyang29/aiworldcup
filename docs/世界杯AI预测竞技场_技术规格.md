# 世界杯 AI 预测竞技场 · 技术规格(交付 code agent）

> 本文件是给 code agent 的实现规格。先读完"0 项目铁律"再动手。
> 目标:在 **2026/06/28 淘汰赛(32 强)开始前**上线一个 MVP。时间约 12 天,范围必须砍到能按时上线。

---

## 0. 项目铁律（HARD RULES，任何阶段都不可违反）

1. **绝不伪造或补录预测。** 只能为**尚未开赛**的比赛生成预测。每条模型/用户预测的 `locked_at` 必须早于该场 `kickoff_utc`,否则拒绝写入。已经踢过的比赛**不补预测、不抄竞品数据**。公信力是本产品唯一的核心资产。
2. **公平性:所有模型用同一份上下文 + 同一个提示词。** 不给任何模型开小灶。
3. **预测锁定后不可修改。** 数据库层 + 应用层都要禁止更新已锁定的预测。
4. **密钥分离。** `service_role` 仅用于服务端批处理;前端只用 `anon key` + RLS。绝不把 service_role 暴露到客户端。
5. **RLS:** 用户只能写自己的预测,且只能在该场开赛前写。
6. **移动端优先。** 任何 UI 改动上线前必须在移动端实测。
7. **UGC 与 SEO 隔离。** 用户预测、时间戳、排行榜这些动态内容不得污染比赛页的主关键词内容。
8. **合法性:纯积分,无提现、无现金、无加密货币。** 这是一个免费娱乐 + 内容产品,不是博彩。
9. **不暗示 AI 厂商背书。** 文案统一写"使用 X 模型生成的预测"。

---

## 1. 产品一句话

> 让市面上主流大模型(GPT、Claude、Gemini、Grok、DeepSeek 等)在 2026 世界杯每场比赛**赛前公开预测**,按真实结果计分排名;用户也能预测,和 AI 同台比——**"你能赢过 GPT 吗?"**

核心差异点(对手都是 AI 速成的数据堆砌、看不懂):**一眼看懂 + 好看 + 人类 vs AI 的情绪钩子。**

---

## 2. 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端/页面 | **Next.js (App Router) + Tailwind**,部署 **Vercel** | SSR 利于 SEO;比赛页服务端渲染 |
| 数据库/认证 | **Supabase**(Postgres + Auth + RLS) | 存比赛/预测/结果/用户/积分 |
| 多模型预测 | **OpenRouter**(一个接口调所有模型) | 服务端调用 |
| 足球数据 | **football-data.org**(免费档含世界杯,限速 10 次/分)起步;不够再换 API-Football | 只需赛程 + 终场比分 |
| 定时任务 | **GitHub Actions(免费 cron,无时长限制)** 或小 VPS | 跑预测/算分批处理,写 Supabase。**不要放 Vercel 函数**(会超时) |

环境变量:
```
OPENROUTER_API_KEY=
FOOTBALL_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # 仅批处理用
```

---

## 3. 架构与数据流

```
[GitHub Actions cron] ── 赛前任务 ──► 拉赛程(football API)
                                      └► 给所有模型同一上下文+提示词(OpenRouter)
                                      └► 锁定预测写入 Supabase (locked_at < kickoff)
                          ── 赛后任务 ──► 拉终场比分(football API)
                                      └► 给所有模型+用户算分,更新榜单

[Vercel / Next.js] ──读──► Supabase ──► 比赛页 / 模型榜 / 人类榜 / 用户预测
```

两个任务解耦于网站。网站只读 Supabase,不跑预测。

---

## 4. 数据模型（Supabase / Postgres）

```sql
-- 球队（可从 football API 同步，或手动种子）
teams(
  id uuid pk, external_id text, name text, code text,
  flag_url text, fifa_rank int
)

-- 比赛
matches(
  id uuid pk, external_id text unique,
  stage text,                 -- 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
  group_label text,           -- 'A'..'L'，淘汰赛为 null
  home_team_id uuid, away_team_id uuid,
  kickoff_utc timestamptz not null,
  venue text,
  status text,                -- 'scheduled' | 'live' | 'finished'
  home_score int, away_score int,      -- 90 分钟（常规时间）比分
  advanced_team_id uuid,      -- 淘汰赛晋级队（含加时/点球后），group 阶段为 null
  settled_at timestamptz
)

-- 参赛模型
models(
  id uuid pk, name text,            -- 'Claude Opus 4.x'
  provider text,                    -- 'Anthropic'
  openrouter_slug text,             -- 'anthropic/claude-...'（用当前可用 slug）
  display_order int, active bool default true
)

-- 模型预测（赛前锁定，不可改）
model_predictions(
  id uuid pk, match_id uuid, model_id uuid,
  pred_home int, pred_away int,
  pred_advance_team_id uuid,        -- 仅淘汰赛
  reasoning text,                   -- 最多 2 句
  locked_at timestamptz not null,   -- 必须 < matches.kickoff_utc
  points int,                       -- 赛后算分填入
  unique(match_id, model_id)
)

-- 用户预测（赛前锁定，不可改）
user_predictions(
  id uuid pk, user_id uuid, match_id uuid,
  pred_home int, pred_away int,
  pred_advance_team_id uuid,
  locked_at timestamptz not null,   -- 必须 < kickoff
  points int,
  unique(user_id, match_id)
)

profiles(
  user_id uuid pk, display_name text
)
```

**RLS 要点:**
- `model_predictions`:前端只读(已锁定的)。写入只允许 service_role。
- `user_predictions`:用户只能 `insert` 自己的行,且 `kickoff_utc > now()`;不允许 `update`/`delete` 已存在的预测。
- `matches`/`models`/`teams`:公开只读。

---

## 5. 预测引擎（赛前任务）

**触发**:GitHub Actions,每天比赛日最早开赛前若干小时跑一次(也可每场单独定时)。只处理 `status='scheduled'` 且 `kickoff_utc > now()` 且尚无预测的比赛。

**步骤**:
1. 为每场比赛构造**统一上下文简报**(对所有模型完全相同):
   - 双方队名、FIFA 排名、近 5 场战绩、所在小组当前积分(group 阶段)、赛事阶段、球场。
2. 对每个 `active` 模型,用**同一个提示词**调 OpenRouter。
3. 校验返回的 JSON,写入 `model_predictions`,`locked_at = now()`(并断言 < kickoff)。

**统一提示词模板**(系统 + 用户):
```
SYSTEM:
You are predicting a football (soccer) match at the 2026 FIFA World Cup.
Predict the final scoreline after 90 minutes (regulation time only).
{若为淘汰赛追加:} Also predict which team advances (after extra time/penalties if needed).
Base your prediction ONLY on the context provided below. Do not look anything up.
Respond with STRICT JSON only, no markdown:
{"home_score": int, "away_score": int, "advance_team": "<team name or null>", "reasoning": "<max 2 sentences>"}

USER:
Match: {home} vs {away}
Stage: {stage} {group}
Venue: {venue}
FIFA rank: {home} #{r1}, {away} #{r2}
Recent form (last 5): {home}: {form1} | {away}: {form2}
Group standings: {standings or "N/A"}
```

**OpenRouter 调用形态**(服务端):
```
POST https://openrouter.ai/api/v1/chat/completions
headers: Authorization: Bearer OPENROUTER_API_KEY
body: { model: <slug>, messages: [system, user], temperature: 0.7,
        response_format: { type: "json_object" } }
```

**模型清单**:不要硬编码可能过时的 slug。让脚本从 OpenRouter 的模型列表里取当前可用的前沿模型,选一组(建议 10–12 个),覆盖:闭源前沿(GPT / Claude / Gemini / Grok)+ 强开源/区域(DeepSeek / Qwen / GLM / Kimi / Mistral / Llama 等)。slug 以 OpenRouter 当前实际值为准。

---

## 6. 计分规则（赛后任务）

**触发**:GitHub Actions,定时拉取 `status != 'finished'` 但已结束的比赛,填入 `home_score/away_score`(90 分钟比分)、淘汰赛填 `advanced_team_id`,然后给该场所有模型 + 用户预测算分。

**计分(模型与用户完全相同)**:对每条预测,比对 90 分钟比分:
- **猜中精确比分**:5 分
- **猜对胜负 + 猜对净胜球**(但比分不完全对):3 分
- **只猜对胜负(含平局)**:1 分
- **胜负猜错**:0 分
- **淘汰赛额外**:另判 `pred_advance_team_id == advanced_team_id`,对则 **+2 分**(晋级判定用加时/点球后的最终结果)。

榜单 = 按累计 `points` 排序(模型榜、用户榜各一份;可做合并总榜,模型和真人混排)。

---

## 7. 页面结构

| 路由 | 内容 | 备注 |
|---|---|---|
| `/`(首页) | **一眼看懂**:当前模型榜 Top + 下一场比赛 + "和 AI 比一把"CTA | 首屏就讲清"哪个 AI 最准、你能不能赢它" |
| `/match/[id]` | 该场各模型的预测 + **可读的推理**;结束后显示真实比分 + 谁猜对 | 推理写成人话,是独特 SEO 内容 |
| `/leaderboard` | 模型榜 + 人类榜(可切换/合并) | 实时 |
| `/predict` | 列出即将开赛的比赛,用户提交预测 | 需登录;开赛后锁定 |
| `/me` | 我的预测 + 我 vs AI 的名次 | |

**设计原则(差异化的核心,务必做到)**:
- 首屏一句话讲清价值,不堆表格。
- 模型推理用自然语言呈现,不要 JSON / 原始表格。
- "人类 vs AI"放显眼处,做情绪钩子。
- 移动端优先;比赛结果做成**可一键分享的卡片**(裂变)。

---

## 8. 分阶段构建（赶 6/28 上线）

**Phase 1（第 1–3 天,MVP,达到即可上线）**
- football API 接入,赛程同步进 `matches`。
- 预测引擎跑通:为即将到来的比赛锁定各模型预测(写 `model_predictions`)。
- 赛后算分任务。
- 比赛页 + 模型榜。
> 到这里就是一个完整可发布的产品。

**Phase 2（第 4–7 天,差异化钩子)**
- Supabase Auth(支持匿名/邮箱登录)。
- 用户预测 + 人类 vs AI 榜。
- 首屏"一眼看懂"的设计落地 + 移动端。

**Phase 3（第 8–12 天,打磨/变现)**
- 可分享结果卡。
- 接 AdSense(本项目是事件/裂变流量,可早上广告)。
- 移动端打磨、缓冲、修边。

---

## 9. 暂不做（明确排除，省时间）

- 提现/支付/加密货币(永远不做)。
- 比分之外的复杂数据(xG、赔率、阵容)。
- 多语言(上线后视流量再加)。
- 复杂的反作弊(用户量起来后再加 Turnstile + 限流)。

---

## 10. 验收清单（上线前自检）

- [ ] 所有模型预测的 `locked_at` 均早于对应 `kickoff_utc`
- [ ] 未对任何已开赛比赛补录预测
- [ ] 所有模型用了相同上下文 + 相同提示词
- [ ] service_role 未出现在前端代码/打包产物中
- [ ] RLS:用户无法改他人预测、无法在开赛后下注
- [ ] 移动端实测通过
- [ ] 比赛页主内容(队伍/预测/推理)与 UGC(用户预测/时间戳)结构隔离
- [ ] 文案未暗示 AI 厂商背书
- [ ] 站内无任何提现/现金/加密入口
