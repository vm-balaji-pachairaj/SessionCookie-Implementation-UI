import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // {
      //   source: "/api/refresh",
      //   destination: "http://localhost:5000/refresh",
      // },
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/:path*", // Proxy to backend
      },
    ];
  },
};

export default nextConfig;
