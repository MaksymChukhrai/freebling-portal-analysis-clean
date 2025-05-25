/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "build",
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    unoptimized: true, // ОТКЛЮЧАЕМ оптимизацию изображений
  },
  // УБИРАЕМ ВСЕ оптимизации webpack
};

module.exports = nextConfig;