import { NextResponse, type NextRequest } from "next/server";

const FRAME_SOURCES = [
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://open.spotify.com",
  "https://w.soundcloud.com",
  "https://player-widget.mixcloud.com",
];

/** Where track previews come from, measured in the browser for a tempo. Matches `previewUrl` in the API. */
const PREVIEW_SOURCES = ["https://*.dzcdn.net", "https://*.itunes.apple.com"];

function contentSecurityPolicy(nonce: string) {
  const development = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src 'self' https://vitals.vercel-insights.com ${PREVIEW_SOURCES.join(" ")}${development ? " ws:" : ""}`,
    "media-src 'self' blob:",
    `frame-src ${FRAME_SOURCES.join(" ")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon|sw.js|offline.html|robots.txt|sitemap.xml|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
