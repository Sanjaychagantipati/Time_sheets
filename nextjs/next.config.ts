import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  async rewrites() {
    return [
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*|assets/.*).*)",
        destination: "/index.html",
      },
    ];
  },
};

export default nextConfig;
