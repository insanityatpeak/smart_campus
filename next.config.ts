import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" }, // blocks clickjacking via iframes
          { key: "X-Content-Type-Options", value: "nosniff" }, // stops MIME-type sniffing
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // limits URL leakage on outbound links
        ],
      },
    ];
  },
};

export default nextConfig;