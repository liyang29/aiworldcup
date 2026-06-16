// 在 GitHub Actions（美国 runner）上验证：被本地区域封锁的 GPT/Claude/Gemini
// 能否从这里调通。本地运行同样可用（中国区会看到 403）。
const key = process.env.OPENROUTER_API_KEY;
if (!key) {
  console.error('❌ 缺少 OPENROUTER_API_KEY');
  process.exit(1);
}

// 注意：slug 以 OpenRouter 当前实际值为准（不要硬编码会过时的旧 slug）
const MODELS = [
  'openai/gpt-5.5',
  'anthropic/claude-opus-4.8',
  'google/gemini-3.5-flash',
  'x-ai/grok-4.3',
  'deepseek/deepseek-v3.2',
];

async function test(slug) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: slug,
        temperature: 0.7,
        max_tokens: 60,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Respond STRICT JSON only: {"home_score":int,"away_score":int}' },
          { role: 'user', content: 'Brazil vs Serbia final score?' },
        ],
      }),
    });
    const j = await r.json();
    if (r.status !== 200) {
      const blocked = r.status === 403 ? ' 🚫区域封锁' : '';
      console.log(`❌ ${slug} → HTTP ${r.status}${blocked} | ${(j.error?.message || '').slice(0, 80)}`);
      return false;
    }
    console.log(`✅ ${slug} → ${j.choices?.[0]?.message?.content?.replace(/\s+/g, ' ').slice(0, 60)}`);
    return true;
  } catch (e) {
    console.log(`❌ ${slug} → 异常 ${e.message}`);
    return false;
  }
}

const results = [];
for (const m of MODELS) results.push([m, await test(m)]);

console.log('\n==== 汇总 ====');
const ok = results.filter(([, v]) => v).map(([m]) => m);
const bad = results.filter(([, v]) => !v).map(([m]) => m);
console.log('可用:', ok.join(', ') || '(无)');
console.log('不可用:', bad.join(', ') || '(无)');
