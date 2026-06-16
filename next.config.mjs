/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 国旗等远程图片域名，按需补充
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'flagcdn.com' },
      { protocol: 'https', hostname: 'crests.football-data.org' },
    ],
  },
};

export default nextConfig;
