import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// OAuth 登录回调：用 code 换 session，并把 Google/X 的昵称+头像写进 profiles。
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const md = (user.user_metadata ?? {}) as Record<string, string>;
        const patch: Record<string, string> = {};
        const name = md.full_name || md.name;
        const avatar = md.avatar_url || md.picture;
        if (name) patch.display_name = name;
        if (avatar) patch.avatar_url = avatar;
        if (Object.keys(patch).length) {
          await supabase.from('profiles').update(patch).eq('user_id', user.id);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/`);
}
