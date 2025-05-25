/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    unoptimized: true,
  },
  
  // Отключаем строгие проверки
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // ВКЛЮЧАЕМ CSS оптимизацию
  experimental: {
    optimizeCss: true, // Включили обратно
  },
  
  // Убираем webpack exclusions - больше не нужны
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig;