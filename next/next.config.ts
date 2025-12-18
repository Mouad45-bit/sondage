/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
      {
        source: "/backend/auth/:path*",
        destination: "http://localhost:8080/auth/:path*",
      },
    ];
  },
};

module.exports = nextConfig;