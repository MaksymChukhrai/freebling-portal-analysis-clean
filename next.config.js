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
  
  // УБИРАЕМ experimental совсем - это вызывает проблемы
  // experimental: {
  //   optimizeCss: false,
  // },
};

module.exports = nextConfig;