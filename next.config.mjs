/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // PWA service worker is handled via manifest.json in /public
  // Add @ducanh2912/next-pwa back for production when backend is ready
};

export default nextConfig;
