const API_REWRITE_DESTINATION =
  process.env.NODE_ENV === "production"
    ? "http://hcp-api-gateway-svc:80/:path*"
    : "http://api.happycloud.net/:path*";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: API_REWRITE_DESTINATION
      }
    ];
  }
};

export default nextConfig;
