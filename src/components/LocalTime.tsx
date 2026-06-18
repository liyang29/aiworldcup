'use client';

import { useEffect, useState } from 'react';

// 比赛时间统一在客户端按"访客本地时区"渲染（服务端是 UTC，直接渲染会显示成 UTC 时间）。
// 首屏先显示服务端的 UTC 文本，挂载后 useEffect 重新格式化成本地时区；
// suppressHydrationWarning 抑制这次预期内的服务端/客户端文本差异。
export default function LocalTime({
  utc,
  localeTag,
  options,
}: {
  utc: string;
  localeTag: string;
  options: Intl.DateTimeFormatOptions;
}) {
  const fmt = () => new Date(utc).toLocaleString(localeTag, options);
  const [text, setText] = useState(fmt);
  useEffect(() => {
    setText(fmt());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utc, localeTag]);
  return <span suppressHydrationWarning>{text}</span>;
}
