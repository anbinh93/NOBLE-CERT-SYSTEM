import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/public/:path*',
        destination: `${API_URL}/api/public/:path*`,
      },
      {
        source: '/api/student/:path*',
        destination: `${API_URL}/api/student/:path*`,
      },
      {
        source: '/api/v2/:path*',
        destination: `${API_URL}/api/v2/:path*`,
      },
      {
        source: '/api/issuers/:path*',
        destination: `${API_URL}/api/issuers/:path*`,
      },
      {
        source: '/api/user/:path*',
        destination: `${API_URL}/api/user/:path*`,
      },
      // Proxy global auth check (login/google-sync) but keep NextAuth endpoints internal
      {
        source: '/api/auth/login',
        destination: `${API_URL}/api/v1/auth/login`,
      },
      {
        source: '/api/auth/google-sync',
        destination: `${API_URL}/api/v1/auth/google-sync`,
      },
      {
        source: '/api/payment/:path*',
        destination: `${API_URL}/api/payment/:path*`,
      },
      // Catch-all for other backend modules not conflicting with NextAuth
      // Note: We deliberately do NOT proxy /api/auth/session, /api/auth/signin etc.

    ];
  },
};

export default nextConfig;
