import { IconTrophy } from '@tabler/icons-react';
import type { Dictionary } from '@/i18n/dictionaries';

export default function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-16 border-t border-hairline">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-2 px-4 py-8 text-center sm:px-6 lg:px-8">
        <span className="flex items-center gap-1.5 text-xs text-body">
          <IconTrophy size={14} /> {dict.footer.tagline}
        </span>
        <p className="text-[11px] text-mute">{dict.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
