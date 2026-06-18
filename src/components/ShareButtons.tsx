'use client';

import { useState } from 'react';
import {
  IconBrandX,
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconBrandReddit,
  IconLink,
  IconCheck,
} from '@tabler/icons-react';

// 社交分享按钮（比赛页等）。深链到各平台分享意图 + 复制链接。
export default function ShareButtons({
  url,
  title,
  t,
}: {
  url: string;
  title: string;
  t: { share: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const x = encodeURIComponent(title);

  const links = [
    { Icon: IconBrandX, label: 'X', href: `https://twitter.com/intent/tweet?text=${x}&url=${u}` },
    { Icon: IconBrandFacebook, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { Icon: IconBrandWhatsapp, label: 'WhatsApp', href: `https://wa.me/?text=${x}%20${u}` },
    { Icon: IconBrandTelegram, label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${x}` },
    { Icon: IconBrandReddit, label: 'Reddit', href: `https://www.reddit.com/submit?url=${u}&title=${x}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-mute">{t.share}</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-mute transition-colors hover:border-mute hover:text-ink"
        >
          <l.Icon size={17} />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-3 text-xs text-mute transition-colors hover:border-mute hover:text-ink"
      >
        {copied ? <IconCheck size={15} /> : <IconLink size={15} />}
        {copied ? t.copied : ''}
      </button>
    </div>
  );
}
