/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
//   i18n: {
//     locales: ['en-US', 'zh-CN'],
//     defaultLocale: 'en-US',
//   },
};

module.exports = nextConfig;
