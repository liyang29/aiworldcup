import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function pickLocale(req: NextRequest): string {
  const header = req.headers.get('accept-language') || '';
  const prefs = header.split(',').map((s) => s.split(';')[0].trim().toLowerCase());
  for (const p of prefs) {
    const base = p.split('-')[0];
    if ((locales as readonly string[]).includes(base)) return base;
  }
  return defaultLocale;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = (locales as readonly string[]).some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  // 无语种前缀 → 重定向到语种路径（无需触碰 Supabase）
  if (!hasLocale) {
    const locale = pickLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // 有语种 → 刷新 Supabase 登录会话（写回 cookie）
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );
  await supabase.auth.getUser();
  return res;
}

export const config = {
  // 排除静态资源/接口/auth 回调/带扩展名的文件
  matcher: ['/((?!_next|api|auth|models|flags|images|.*\\.).*)'],
};
