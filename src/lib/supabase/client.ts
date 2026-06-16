import { createBrowserClient } from '@supabase/ssr';

/**
 * 浏览器端 Supabase 客户端：仅用 anon key + RLS（铁律4/5）。
 * 绝不在这里引用 service_role。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
