/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['placeimg.com', 'banarica.com'], // Para permitir imágenes de esos dominios
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // ✅ desactiva el PWA en desarrollo
  register: true,
  skipWaiting: true, // Opcional: hace que el SW tome control inmediatamente en producción
});

module.exports = withPWA(nextConfig);
