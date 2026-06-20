import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 无 cookie 的「公共只读」客户端：仅 anon key，不读 cookies。
// 用它查公共数据的页面不会因 cookies() 被强制动态，从而可以 ISR 缓存。
// 个人化数据（登录态/我的排名）一律走客户端组件单独取。
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
