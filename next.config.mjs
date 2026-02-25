/** @type {import('next').NextConfig} */
const distDir = process.env.NEXT_DIST_DIR ?? (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next');

const nextConfig = {
  reactStrictMode: true,
  distDir,
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
