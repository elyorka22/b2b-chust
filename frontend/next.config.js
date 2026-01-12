/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Переменные окружения с префиксом NEXT_PUBLIC_ автоматически доступны в браузере
  // Не нужно дублировать их в env, они уже доступны через process.env
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };
    return config;
  },
}

module.exports = nextConfig

