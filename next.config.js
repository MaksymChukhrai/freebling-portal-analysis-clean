/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "build",
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
  
  // Отключаем CSS оптимизацию для решения проблем с TailwindCSS
  experimental: {
    optimizeCss: false,
  },
  
  webpack: (config, { isServer }) => {
    // Отключаем CSS модули для внешних библиотек
    config.module.rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('css')) {
        rule.exclude = [
          /node_modules\/@reactour/,
          /node_modules\/cropperjs/,
          /node_modules\/react-responsive-modal/,
          /node_modules\/slick-carousel/,
        ];
      }
    });
    return config;
  },
};

module.exports = nextConfig;