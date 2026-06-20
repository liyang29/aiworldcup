'use client';

import { usePathname } from 'next/navigation';
import { IconBrandGoogle, IconLogout, IconUser } from '@tabler/icons-react';
import { signInWithGoogle, signOut } from '@/lib/auth/actions';

export type AccountUser = { isAnon: boolean; name?: string | null; avatar?: string | null };
export type AccountT = { signIn: string; signInGoogle: string; signOut: string; guest: string };

export default function AccountWidget({ user, t }: { user: AccountUser | null; t: AccountT }) {
  const pathname = usePathname();
  const next = pathname || '/';

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
