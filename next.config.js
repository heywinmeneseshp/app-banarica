/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Necesario para el build de Docker (ver Dockerfile): genera .next/standalone,
  // una carpeta autocontenida con solo lo necesario para correr `node server.js`
  // sin arrastrar todo node_modules a la imagen final. No afecta el deploy en
  // Vercel, que lo ignora.
  output: 'standalone',
  images: {
    domains: ['placeimg.com', 'banarica.com'], // Para permitir imágenes de esos dominios
  },
  transpilePackages: ['@react-pdf/renderer'],
};

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // ✅ desactiva el PWA en desarrollo
  register: true,
  skipWaiting: true, // Opcional: hace que el SW tome control inmediatamente en producción
});

module.exports = withPWA(nextConfig);
