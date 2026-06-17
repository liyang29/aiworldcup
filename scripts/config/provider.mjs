// ============================================================
// LLM 平台(provider)配置 —— 预留：以后换平台只改这里
// ============================================================
//
// 当前用 OpenRouter（一个接口调多家模型）。
// 如果以后要换平台（例如换成某个直连 OpenAI 兼容网关、或国内聚合平台），
// 通常只需改下面三处，业务逻辑(预测引擎)完全不用动：
//
//   1) BASE_URL        —— 新平台的 chat/completions 接口地址
//   2) API_KEY 环境变量 —— 在 .env.local / GitHub Secrets 里换成新平台的 key
//   3) 各模型的 slug    —— 见 scripts/config/models.mjs（不同平台 slug 命名不同）
//
// 只要新平台兼容 OpenAI 的 /chat/completions + response_format:json_object，
// 这套代码就能直接跑。若新平台协议不同，只需改 scripts/lib/llm.mjs 里的请求体。
//
// 切换示例（换成自有 OpenAI 兼容网关）：
//   LLM_BASE_URL=https://your-gateway.example.com/v1/chat/completions
//   LLM_API_KEY=sk-xxxx
// ------------------------------------------------------------

export const PROVIDER = {
  // 接口地址：默认 OpenRouter，可被环境变量 LLM_BASE_URL 覆盖
  baseUrl:
    process.env.LLM_BASE_URL ||
    'https://openrouter.ai/api/v1/chat/completions',

  // API Key：优先用通用的 LLM_API_KEY，回退到 OPENROUTER_API_KEY
  // 换平台时：在环境变量里设置新的 key 即可，不必改代码
  apiKey: process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY,

  // OpenRouter 建议带的可选头（非必须）；换平台可清空
  extraHeaders: {
    'HTTP-Referer': 'https://github.com/liyang29/aiworldcup',
    'X-Title': 'AI World Cup Arena',
  },

  // 统一采样温度（公平性：所有模型同参数，铁律2）
  temperature: 0.7,

  // 联网搜索：给所有模型统一加 OpenRouter 的 :online（保持公平）。
  // 让模型能搜临场伤停/首发/状态，临近开赛预测时数据更新更准。
  // 想关掉：环境变量 LLM_SEARCH=false
  search: (process.env.LLM_SEARCH ?? 'true') !== 'false',
};
