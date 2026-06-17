import Link from 'next/link';
import { IconTrophy } from '@tabler/icons-react';
import LangSwitcher from './LangSwitcher';
import AccountWidget from './AccountWidget';
import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export default async function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const nav = dict.nav;
  const base = `/${locale}`;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let acctUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    acctUser = {
      isAnon: !!user.is_anonymous,
      name: profile?.display_name ?? null,
      avatar: profile?.avatar_url ?? null,
    };
  }

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={base} className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-sunset text-canvas">
            <IconTrophy size={17} stroke={2} />
          </span>
          <span className="text-sm font-medium tracking-tight text-ink">AI World Cup</span>
        </Link>

        <nav className="flex items-center gap-3 text-xs text-mute sm:gap-5">
          <span className="hidden items-center gap-4 sm:flex sm:gap-5">
            <Link href={`${base}#next`} className="hover:text-ink">
              {nav.latest}
            </Link>
            <Link href={`${base}#leaderboard`} className="hover:text-ink">
              {nav.leaderboard}
            </Link>
            <Link href={`${base}#schedule`} className="hover:text-ink">
              {nav.schedule}
            </Link>
          </span>
          <Link
            href={`${base}/predict`}
            className="rounded-full bg-sunset px-3 py-1 font-medium text-canvas"
          >
            {dict.predict.navLabel}
          </Link>
          <AccountWidget user={acctUser} t={dict.account} />
          <LangSwitcher current={locale} />
        </nav>
      </div>
    </header>
  );
}
