import Link from 'next/link';
import { IconTrophy } from '@tabler/icons-react';
import LangSwitcher from './LangSwitcher';
import AccountWidget from './AccountWidget';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

// 注意：不在此处读 cookie/登录态（登录态由 AccountWidget 在客户端自取），
// 否则布局会让所有页面被迫动态、无法缓存。
export default function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const nav = dict.nav;
  const base = `/${locale}`;

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href={base}
          aria-label="AI World Cup — home"
          className="-my-1 flex shrink-0 cursor-pointer items-center gap-2 rounded-md py-1 pr-2 transition-opacity hover:opacity-80"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-sunset text-canvas">
            <IconTrophy size={17} stroke={2} />
          </span>
          <span className="hidden whitespace-nowrap text-sm font-medium tracking-tight text-ink min-[400px]:inline">
            AI World Cup
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-xs text-mute sm:gap-5">
          <span className="hidden items-center gap-4 sm:flex sm:gap-5">
            <Link href={`${base}#next`} className="hover:text-ink">
              {nav.latest}
            </Link>
            <Link href={`${base}#leaderboard`} className="hover:text-ink">
              {nav.leaderboard}
            </Link>
            <Link href={`${base}#rules`} className="hover:text-ink">
              {nav.rules}
            </Link>
            <Link href={`${base}#schedule`} className="hover:text-ink">
              {nav.schedule}
            </Link>
          </span>
          <Link
            href={`${base}/predict`}
            className="shrink-0 whitespace-nowrap rounded-full bg-sunset px-3 py-1 font-medium text-canvas"
          >
            {dict.predict.navLabel}
          </Link>
          <AccountWidget t={dict.account} />
          <LangSwitcher current={locale} />
        </nav>
      </div>
    </header>
  );
}
