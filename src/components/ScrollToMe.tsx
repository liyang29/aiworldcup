'use client';

import { useEffect } from 'react';

// 排行榜页加载后，若本人在榜单内，自动滚动到并居中自己那一行（一次性，零持续开销）。
export default function ScrollToMe({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [targetId]);
  return null;
}
