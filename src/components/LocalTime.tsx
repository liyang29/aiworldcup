'use client';

import { useEffect, useState } from 'react';

// 比赛时间统一按"访客设备本地时区"显示。
// 关键：初始值确定性地按 UTC 渲染（服务端 SSG/动态、客户端首帧都一致，避免 hydration 不一致）；
// 挂载后 useEffect 再切到访客本地时区。
// 因为初始(UTC) 与挂载后(本地时区) 必然不同（除非访客本就在 UTC），
// setText 一定触发重渲染，DOM 必定更新到设备时区——修复"停留在服务端时区"的 bug。
export default function LocalTime({
  utc,
  localeTag,
  options,
}: {
  utc: string;
  localeTag: string;
  options: Intl.DateTimeFormatOptions;
}) {
  const [text, setText] = useState(() =>
    new Date(utc).toLocaleString(localeTag, { ...options, timeZone: 'UTC' })
  );
  useEffect(() => {
    setText(new Date(utc).toLocaleString(localeTag, options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utc, localeTag]);
  return <span suppressHydrationWarning>{text}</span>;
}
