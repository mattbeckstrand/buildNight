import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com", // Google avatars
      "toioiynlceawfpctjmzw.supabase.co", // Supabase Storage images
    ],
  },
};

export default nextConfig;
