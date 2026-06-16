// 仅供服务端批处理脚本（预测/算分/同步）使用的 Supabase 客户端。
// 用 service_role key，绕过 RLS。绝不可被前端引用（铁律4）。
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    '缺少 SUPABASE URL 或 SUPABASE_SERVICE_ROLE_KEY，请检查环境变量/.env.local'
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
