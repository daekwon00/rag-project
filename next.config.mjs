/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdf-parse를 위한 설정
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
