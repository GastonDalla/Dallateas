import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Doto } from "next/font/google";
import { headers } from "next/headers";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "../index.css";
import { BottomNav } from "@/components/bottom-nav";
import { MobileBar } from "@/components/shell/mobile-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { SiteHeader } from "@/components/shell/site-header";
import Providers from "@/components/providers";
import { serializeJsonLd } from "@/lib/json-ld";
import { getSession } from "@/server/session";
import { ServiceWorker } from "@/components/service-worker";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

/** Dot-matrix figures, like the screen of a mixer or a CDJ. Only for live readouts. */
const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  axes: ["ROND"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f2" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

const siteUrl = process.env.BETTER_AUTH_URL ?? "https://dallateas.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dallateas — Organizá tu colección de vinilos",
    template: "%s | Dallateas",
  },
  description:
    "BPM por track, tonalidad y pitch para mezclar en bandejas. Armá tus bateas y tus sets, y compartilos.",
  keywords: ["vinilos", "DJ", "colección", "bateas", "BPM", "tonalidad", "pitch", "sets", "discogs", "vinyl", "crate digging"],
  authors: [{ name: "Dallateas" }],
  creator: "Dallateas",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: "Dallateas",
    title: "Dallateas — Organizá tu colección de vinilos",
    description: "BPM por track, tonalidad y pitch para mezclar en bandejas. Armá tus bateas y tus sets, y compartilos.",
    images: [{ url: "/favicon/web-app-manifest-512x512.png", width: 512, height: 512, alt: "Dallateas" }],
  },
  twitter: {
    card: "summary",
    title: "Dallateas — Organizá tu colección de vinilos",
    description: "BPM por track, tonalidad y pitch para mezclar en bandejas.",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dallateas",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dallateas",
  description: "BPM por track, tonalidad y pitch para mezclar en bandejas. Armá tus bateas y tus sets, y compartilos.",
  url: siteUrl,
  applicationCategory: "MusicApplication",
  operatingSystem: "Web",
  image: `${siteUrl}/favicon/web-app-manifest-512x512.png`,
  screenshot: `${siteUrl}/favicon/web-app-manifest-512x512.png`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [requestHeaders, session] = await Promise.all([headers(), getSession()]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const signedIn = Boolean(session?.user.emailVerified);

  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      </head>
      <body className={`${barlow.variable} ${barlowCondensed.variable} ${doto.variable} bg-background font-sans antialiased`}>
        <Providers nonce={nonce}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Saltar al contenido principal
          </a>
          {signedIn ? (
            <div className="flex min-h-svh">
              <Sidebar />
              <div className="min-w-0 flex-1 pt-[env(safe-area-inset-top)]">
                <MobileBar />
                <main id="main-content" tabIndex={-1} className="pb-24 outline-none md:pb-0">
                  {children}
                </main>
              </div>
              <BottomNav />
            </div>
          ) : (
            <div className="flex min-h-svh flex-col pt-[env(safe-area-inset-top)]">
              <SiteHeader />
              <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
            </div>
          )}
        </Providers>
        <ServiceWorker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
