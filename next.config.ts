import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // better-sqlite3 is a native Node module — keep it out of the bundler.
  serverExternalPackages: ["better-sqlite3"],
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    },
  ],
}

export default nextConfig
