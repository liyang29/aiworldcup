// ============================================================
// 参赛模型清单 —— 配置化，方便增删/换平台
// ============================================================
//
// 字段说明：
//   name          展示名（页面/榜单显示，写"人话"）
//   provider      厂商（页面分组/标识用）
//   slug          当前平台(OpenRouter)的调用 id —— 换平台时改这里
//   display_order 榜单/页面排序
//   active        false = 暂不参赛（保留配置但不调用）
//
// ⚠️ 换平台注意：不同平台同一个模型的 slug 命名不同。
//    换平台时，把每行的 slug 改成新平台对应的值即可，其余不动。
//    平台地址/Key 在 scripts/config/provider.mjs 配置。
//
// ⚠️ slug 时效：slug 以平台“当前实际可用值”为准，可能随版本更新。
//    可用 `node scripts/test/region-check.mjs` 或平台模型列表核对。
//
// 本清单会被 `node scripts/seed/models.mjs` 同步进数据库 models 表。
// ------------------------------------------------------------

export const MODELS = [
  // ---- 当前在你区域 + 当前平台(OpenRouter)实测可用 ----
  { name: 'Grok 4.3',        provider: 'xAI',       slug: 'x-ai/grok-4.3',                 display_order: 10, active: true },
  { name: 'DeepSeek V3.2',   provider: 'DeepSeek',  slug: 'deepseek/deepseek-v3.2',        display_order: 20, active: true },
  { name: 'Qwen3.6 Flash',   provider: 'Alibaba',   slug: 'qwen/qwen3.6-flash',            display_order: 30, active: true },
  { name: 'GLM-5',           provider: 'Zhipu',     slug: 'z-ai/glm-5',                    display_order: 40, active: true },
  { name: 'Kimi K2.6',       provider: 'Moonshot',  slug: 'moonshotai/kimi-k2.6',          display_order: 50, active: true },
  { name: 'Llama 4 Maverick',provider: 'Meta',      slug: 'meta-llama/llama-4-maverick',   display_order: 60, active: true },
  { name: 'Mistral Medium 3.5', provider: 'Mistral AI', slug: 'mistralai/mistral-medium-3-5', display_order: 70, active: true },

  // ============================================================
  // 预留位：美国三家（GPT / Claude / Gemini）
  // 现状：当前 OpenRouter 账号(中国区)调用返回 403，暂不可用。
  // 解锁方式（任选其一）：
  //   a) 换一个非中国区的 OpenRouter 账号/Key；
  //   b) 换一个能直连这三家的平台（改 provider.mjs 的 baseUrl + key + 下面 slug）。
  // 解锁后：把对应行的 active 改成 true（slug 以届时平台实际值为准），
  //         再跑一次 `node scripts/seed/models.mjs` 即可入列，业务逻辑无需改动。
  // ============================================================
  { name: 'GPT-5.5',          provider: 'OpenAI',    slug: 'openai/gpt-5.5',                display_order: 1, active: false },
  { name: 'Claude Opus 4.8',  provider: 'Anthropic', slug: 'anthropic/claude-opus-4.8',     display_order: 2, active: false },
  { name: 'Gemini 3.5 Flash', provider: 'Google',    slug: 'google/gemini-3.5-flash',       display_order: 3, active: false },
];

// 只取启用的模型（预测引擎用这个）
export const activeModels = () => MODELS.filter((m) => m.active);
