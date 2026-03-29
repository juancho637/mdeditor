/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
  async rewrites() {
    const target = 'http://api:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
      {
        source: '/collaboration/:path*',
        destination: `${target}/collaboration/:path*`,
      },
    ];
  },
};

export default nextConfig;
