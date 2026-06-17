// LLM 调用封装 —— 平台无关，读取 scripts/config/provider.mjs。
// 默认走 OpenRouter 的 OpenAI 兼容 /chat/completions。
import { PROVIDER } from '../config/provider.mjs';

if (!PROVIDER.apiKey) {
  throw new Error('缺少 LLM_API_KEY / OPENROUTER_API_KEY，请检查环境变量');
}

async function once(slug, { system, user }) {
  const res = await fetch(PROVIDER.baseUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + PROVIDER.apiKey,
      'Content-Type': 'application/json',
      ...PROVIDER.extraHeaders,
    },
    body: JSON.stringify({
      model: slug,
      temperature: PROVIDER.temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data);
    // 4xx（如区域封锁、模型不存在）重试无意义，标记为不可重试
    const retriable = res.status >= 500 || res.status === 429;
    const err = new Error(`[${slug}] HTTP ${res.status}: ${msg}`);
    err.retriable = retriable;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw Object.assign(new Error(`[${slug}] 空返回`), { retriable: true });

  // 有的模型会包 ```json，做一层兜底清洗
  const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    throw Object.assign(new Error(`[${slug}] JSON 解析失败: ${content.slice(0, 200)}`), {
      retriable: true,
    });
  }
}

/**
 * 调用单个模型，返回严格 JSON 解析后的对象。
 * 对空返回/解析失败/5xx/429 自动重试（思考模型偶发截断时兜底）。
 * @param {string} slug   模型 slug
 * @param {{system:string, user:string}} messages
 * @param {number} [retries=2] 额外重试次数
 */
export async function callModelJSON(slug, messages, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await once(slug, messages);
    } catch (e) {
      lastErr = e;
      if (!e.retriable) break;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}
