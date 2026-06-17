// LLM 调用封装 —— 平台无关，读取 scripts/config/provider.mjs。
// 默认走 OpenRouter 的 OpenAI 兼容 /chat/completions。
import { PROVIDER } from '../config/provider.mjs';

if (!PROVIDER.apiKey) {
  throw new Error('缺少 LLM_API_KEY / OPENROUTER_API_KEY，请检查环境变量');
}

async function once(slug, { system, user }) {
  const body = {
    // 开启搜索时给 slug 加 :online（OpenRouter 联网插件，任意模型可用）
    model: PROVIDER.search ? `${slug}:online` : slug,
    temperature: PROVIDER.temperature,
    max_tokens: 6000, // 容纳思考模型(Kimi等)长思考 + 搜索推理；非思考模型会提前停，不增成本
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  // json_object 强制模式与联网搜索冲突（OpenAI 直接拒）。
  // 开搜索时不强制，靠提示词要求 + 下面的健壮解析兜底。
  if (!PROVIDER.search) body.response_format = { type: 'json_object' };

  const res = await fetch(PROVIDER.baseUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + PROVIDER.apiKey,
      'Content-Type': 'application/json',
      ...PROVIDER.extraHeaders,
    },
    body: JSON.stringify(body),
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

  return Object.assign(parseJson(content), {});
}

// 健壮解析：去 markdown 围栏；失败则抽取第一个 {...} 再试。
function parseJson(content) {
  const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {}
    }
    throw Object.assign(new Error(`JSON 解析失败: ${content.slice(0, 160)}`), { retriable: true });
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
