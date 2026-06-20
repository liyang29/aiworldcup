'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IconBrandGoogle, IconLogout, IconUser } from '@tabler/icons-react';
import { signInWithGoogle, signOut } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/client';

export type AccountT = { signIn: string; signInGoogle: string; signOut: string; guest: string };
type AccountUser = { isAnon: boolean; name: string | null; avatar: string | null };

// 客户端自取登录态（不在服务端渲染里读 cookie），这样任何页面都能被 ISR 缓存而不泄露/写死登录态。
export default function AccountWidget({ t }: { t: AccountT }) {
  const pathname = usePathname();
  const next = pathname || '/';
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const load = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!u) {
        setUser(null);
        setLoaded(true);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', u.id)
        .maybeSingle();
      if (!active) return;
      setUser({
        isAnon: !!u.is_anonymous,
        name: profile?.display_name ?? null,
        avatar: profile?.avatar_url ?? null,
      });
      setLoaded(true);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 加载中：占位，避免抖动
  if (!loaded) {
    return <span className="h-6 w-6 rounded-full bg-hairline/50" aria-hidden="true" />;
  }

  // 已登录真实账号：头像 + 退出
  if (user && !user.isAnon) {
    return (
      <div className="flex items-center gap-2">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={user.name ?? ''} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-hairline text-mute">
            <IconUser size={14} />
          </span>
        )}
        <span className="hidden max-w-[90px] truncate text-xs text-body sm:inline">{user.name}</span>
        <form action={signOut.bind(null, next)}>
          <button type="submit" aria-label={t.signOut} className="text-mute hover:text-ink">
            <IconLogout size={15} />
          </button>
        </form>
      </div>
    );
  }

  // 访客或匿名：用 Google 登录
  return (
    <form action={signInWithGoogle.bind(null, next)}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-xs text-body hover:border-mute"
      >
        <IconBrandGoogle size={14} /> {t.signIn}
      </button>
    </form>
  );
}
