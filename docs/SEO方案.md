# SEO 与变现方案（predworld.fun）

> 配合《上线与运营清单.md》《项目进度表.md》。本文件是 SEO 基建 + 变现的总体方案与执行清单。
> 状态：⬜ 未开始 ｜ 🟡 进行中 ｜ ✅ 已完成
> 分工：🧑‍💻 = 代码（Claude 做）｜ 👤 = 账号/控制台（你做）

---

## 0. 核心定位（先看这个）

- **唯一变现 = 展示广告（AdSense）**。无博彩/付费（铁律8）。
- **收入主力 = 英文流量（美/英/加/澳，单价最高）**；西语中等；**中文冲量但几乎不变现**（Google 在大陆被墙，AdSense 不投大陆）。
- **不硬刚英文头部大词**（predict world cup 等被 ESPN/Squawka/Covers 大站占死，新域名本届排不上）——大词照写（免费 + 为下届攒资产），但本届流量靠下面三条差异化车道：
  1. **英文比赛页长尾**（"[A] vs [B] AI prediction" + 10 模型）→ 变现主力
  2. **排行榜"哪个 AI 最准"**（which AI predicts football best）→ 独有王牌
  3. **中文/西语长尾** → 出排名最快、竞争最少（中文冲量、西语顺带）
- **社交分享裂变**：新域名 SEO 慢，分享卡是本届最快见效的引流。

### 竞品速记
- 直接概念竞品：**GoalIQ**（beat the AI，赛前6h锁定+时间戳，几乎同款，但似为单一 AI）；中文 lightai.io。
- 内容站：Covers（仅ChatGPT）、nysportsday（每场3模型文章）、Tom's Guide；中文媒体（新浪/腾讯/虎嗅）。
- 统计/博彩站：Squawka(Opta+bet365)、Predicd、NerdyTips、CupIndex、模拟器(365scores/dataredonda)。
- **我们的差异化**：10 模型（含国产 DeepSeek/Qwen/Kimi/GLM）同台 + 赛前锁定计分 + 人类vsAI + 三语 + 每模型理由可横向对比 + 不碰博彩（AdSense 友好）。

---

## 1. 页面级 SEO（每页目标词 + 加什么）

| 页面 | 主打词 | 标题示例(EN) | 加什么 | 状态 |
|---|---|---|---|---|
| 首页 ×3语 | predict world cup with AI / can you beat AI | "Predict the 2026 World Cup with AI — 10 Models vs You" | title/desc/H1、OG卡、WebSite 结构化数据 | ⬜ |
| 比赛页 /match ×104×3语 🟢变现主力 | "[A] vs [B] AI prediction" + 10 models | "Czechia vs South Africa: 10 AI Models Predict the Score \| World Cup 2026" | 动态 generateMetadata、OG卡、SportsEvent 结构化数据 | ⬜ |
| 排行榜 /leaderboard 🏆王牌 | which AI predicts football best / most accurate AI | "Which AI Predicts Football Best? Live 2026 World Cup Accuracy Ranking" | title/desc、结构化数据 | ⬜ |
| 预测页 | beat the AI / world cup predictor game | "Take on 10 AIs — Predict World Cup 2026 Scores" | title/desc | ⬜ |
| 🆕 隐私政策 /privacy | （非SEO，AdSense 前置） | — | 新建三语页 | ⬜ |
| 🆕 关于/玩法 /about（可选） | how AI predictions scored | — | 增信 + 助过审 | ⬜ |

比赛页三语标题示例：
- 中：`捷克 vs 南非：10 大 AI 模型比分预测 ｜ 2026世界杯`
- 西：`Chequia vs Sudáfrica: 10 modelos de IA predicen el marcador ｜ Mundial 2026`

---

## 2. 技术 SEO（全站地基）

| 项 | 谁 | 状态 |
|---|---|---|
| sitemap.xml（动态，全部比赛 ×3 语种 URL，共321条） | 🧑‍💻 | ✅ |
| robots.txt（放行爬虫 + 指向 sitemap） | 🧑‍💻 | ✅ |
| hreflang + canonical（en/zh/es 互为多语种，避免重复内容） | 🧑‍💻 | ✅ 各页 alternates：canonical + 三语 hreflang(含 x-default) |
| 结构化数据：比赛页 SportsEvent、首页 WebSite | 🧑‍💻 | 🟡 比赛页 SportsEvent ✅；首页 WebSite 可选待做 |
| OG / Twitter 卡片 meta（分享出大图） | 🧑‍💻 | ⬜ |

---

## 3. 社交裂变（本届最快引流）

| 项 | 谁 | 状态 |
|---|---|---|
| 动态 OG 分享图（队徽 + 10模型站队 + "你能赢过AI吗"） | 🧑‍💻 | ⬜ |
| 分享按钮（X / 微信 / WhatsApp） | 🧑‍💻 | ⬜ |

---

## 4. 变现前置（为 AdSense 铺路）

| 项 | 谁 | 状态 |
|---|---|---|
| 隐私政策页 | 🧑‍💻 | ⬜ |
| 申请 AdSense（用隐私页+现有内容，有审核提前量，越早越好） | 👤 | ⬜ |
| Cookie 同意条（欧盟合规，与 GA4 一起上） | 🧑‍💻 | ⬜ |

---

## 5. 分析（免费，看流量）

| 项 | 谁 | 状态 |
|---|---|---|
| Google Search Console：验证域名 + 提交 sitemap | 👤 | ⬜ |
| GA4：建号给 Measurement ID → 接代码 | 👤 给ID / 🧑‍💻 接 | ⬜ |

---

## 6. 执行顺序（一步步来）

**🟢 第一批（不依赖任何账号，先做）**
sitemap + robots + 三语 metadata + OG meta + hreflang + canonical + SportsEvent 结构化 + 隐私政策页
→ 部署 → 👤 去 GSC 验证 + 提交 sitemap + 申请 AdSense

**🟡 第二批**
动态 OG 分享图 + 分享按钮（裂变）

**🔵 第三批（需账号）**
GA4（你给 Measurement ID）+ Cookie 同意条

---

## 7. 诚实预期

- 做完 ≠ 马上有钱。链条：收录(几天~周) → 长尾排名 → 流量 → AdSense 过审 → 收入。
- 本届广告收入大概率是"小钱/试水"；真正价值 = 攒流量 + 过审 + 域名权重 → **复利到世界杯后的日常联赛**（预测引擎通用，可接欧冠/英超等）。
- 钱主要来自英文流量；中文冲量但基本不变现。

---

## 8. 需要你配合（账号侧）

| 何时 | 你做 |
|---|---|
| 第一批部署后 | GSC 验证域名 + 提交 sitemap；申请 AdSense |
| 第三批 | 建 GA4 给 Measurement ID |

---

## 9. 第一批 · 分步执行进度（一步步来）

| 步骤 | 内容 | 状态 |
|---|---|---|
| **第1步** | robots.txt + sitemap.xml（全站321网址×三语，sitemap内含hreflang） | ✅ 已部署 |
| **第2步** | 三语 metadata + OG meta（首页/比赛页/排行榜/预测页，英文长尾标题）+ 默认 OG 分享大图（edge 生成） | ✅ 已部署 |
| **第3步** | 页面 `<head>` 的 hreflang + canonical（多语种声明、防重复） | ✅ 已部署 |
| **第4步** | 比赛页 SportsEvent 结构化数据（谷歌富结果） | ✅ 已部署（含 name/sport/startDate/endDate/homeTeam/awayTeam/description/image/url）|
| ↳ 待办 | SportsEvent 的 `location`（场馆）——104场全无 venue 数据，免费 API 不提供；该富结果低影响，暂不造假，待有真实场馆源再同步 | ⬜ 低优先 |
| **第5步** | 隐私政策页 /privacy（AdSense 前置） | ⬜ |

> 第一批全部部署后 → 👤 去 Google Search Console 验证域名、提交 `https://predworld.fun/sitemap.xml`；并开始申请 AdSense。
