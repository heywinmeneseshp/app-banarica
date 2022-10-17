/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        domains: ['placeimg.com', 'static.platzi.com'], //Para que deje trabajar con la API con el dominio
    },
  };
  
  const withPWA = require('next-pwa')({
    dest: 'public',
    mode: 'production',
    disable: false,
    register: true,
  });
  
  module.exports = withPWA(nextConfig);
