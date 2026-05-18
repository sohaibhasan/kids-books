import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yfmlegmlkqkzpxotajna.supabase.co',
        pathname: '/storage/v1/object/public/story-images/**',
      },
    ],
  },
};

export default nextConfig;
