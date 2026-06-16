import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * 服务端（RSC / Route Handler）Supabase 客户端：仍用 anon key + RLS，
 * 通过 cookie 携带用户登录态。绝不在网站进程里用 service_role（铁律4）。
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 RSC 中 set 会抛错，可忽略（有 middleware 刷新会话即可）
          }
        },
      },
    }
  );
}
