import "@dallateas/env/web";
import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/i\.discogs\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "discogs-images",
          expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /^https:\/\/img\.youtube\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "youtube-thumbnails",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
      {
        urlPattern: /\/api\/trpc\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "trpc-api",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  typedRoutes: true,
  compress: true,
  transpilePackages: [
    "@dallateas/db",
    "@dallateas/api",
    "@dallateas/auth",
    "@dallateas/env",
  ],
  serverExternalPackages: [
    "@libsql",
    "@libsql/client",
    "@libsql/core",
    "libsql",
    "@prisma/adapter-libsql",
    "@prisma/adapter-pg",
    "pg",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        ({ request }: { request?: string }, callback: Function) => {
          if (
            request &&
            /^(@libsql|libsql|@prisma\/adapter-(libsql|pg)|pg$)/.test(
              request
            )
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.discogs.com" },
      { protocol: "https", hostname: "st.discogs.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=()" },
        ],
      },
      {
        source: "/favicon/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
