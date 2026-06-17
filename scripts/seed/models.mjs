// 把 scripts/config/models.mjs 的模型清单同步进数据库 models 表。
// 幂等：按 openrouter_slug upsert。改了配置后重跑即可。
import { supabaseAdmin } from '../lib/supabase-admin.mjs';
import { MODELS } from '../config/models.mjs';

const rows = MODELS.map((m) => ({
  name: m.name,
  provider: m.provider,
  openrouter_slug: m.slug,
  display_order: m.display_order,
  active: m.active,
}));

const { data, error } = await supabaseAdmin
  .from('models')
  .upsert(rows, { onConflict: 'openrouter_slug' })
  .select();

if (error) {
  console.error('❌ 写入 models 失败:', error.message);
  process.exit(1);
}
console.log(`✅ 已同步 ${data.length} 个模型（active: ${data.filter((m) => m.active).length}）`);
for (const m of data) console.log(`  ${m.active ? '✓' : '·'} ${m.name} [${m.openrouter_slug}]`);
