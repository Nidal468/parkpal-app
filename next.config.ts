import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['api.cloudflare.com', 'imagedelivery.net', 'lh3.googleusercontent.com'],
  },
};

export default nextConfig;
