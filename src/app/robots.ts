import type { MetadataRoute } from 'next';

const BASE = 'https://predworld.fun';

// 生成 /robots.txt：放行所有爬虫，并指向 sitemap。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
