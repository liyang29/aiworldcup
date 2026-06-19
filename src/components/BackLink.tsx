'use client';

import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';

// 「返回」走浏览器后退（恢复上一页的滚动位置，如赛程里点进来的那一行）；
// 若无历史（直接落地/分享进来），则回首页。
export default function BackLink({ home, label }: { home: string; label: string }) {
  const router = useRouter();
  const onClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(home);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-mute hover:text-body"
    >
      <IconArrowLeft size={16} /> {label}
    </button>
  );
}
