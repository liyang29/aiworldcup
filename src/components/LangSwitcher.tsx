'use client';

import { usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

export default function LangSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  // 把路径里的语种段替换成目标语种
  const swap = (loc: Locale) => {
    const parts = pathname.split('/');
    parts[1] = loc; // /[locale]/...
    return parts.join('/') || `/${loc}`;
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-hairline px-1 py-0.5 text-[11px]">
      {locales.map((loc) => (
        <a
          key={loc}
          href={swap(loc)}
          className={`rounded-full px-2 py-0.5 ${
            loc === current ? 'bg-hairline text-ink' : 'text-mute hover:text-body'
          }`}
        >
          {localeNames[loc]}
        </a>
      ))}
    </div>
  );
}
