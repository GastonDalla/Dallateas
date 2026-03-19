import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "../index.css";
import Header from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import Providers from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2c1810",
};

const siteUrl = process.env.BETTER_AUTH_URL ?? "https://dallateas.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dallateas — Organiza tu coleccion de vinilos",
    template: "%s | Dallateas",
  },
  description:
    "Organiza tu coleccion de vinilos en bateas, arma tus sets y comparti tus carpetas con el mundo. Para DJs de vinilos.",
  keywords: ["vinilos", "DJ", "coleccion", "bateas", "sets", "discogs", "vinyl", "crate digging"],
  authors: [{ name: "Dallateas" }],
  creator: "Dallateas",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: "Dallateas",
    title: "Dallateas — Organiza tu coleccion de vinilos",
    description: "Organiza tu coleccion de vinilos en bateas, arma tus sets y comparti tus carpetas con el mundo.",
    images: [{ url: "/favicon/web-app-manifest-512x512.png", width: 512, height: 512, alt: "Dallateas" }],
  },
  twitter: {
    card: "summary",
    title: "Dallateas — Organiza tu coleccion de vinilos",
    description: "Organiza tu coleccion de vinilos en bateas, arma tus sets y comparti tus carpetas.",
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
  description: "Organiza tu coleccion de vinilos en bateas, arma tus sets y comparti tus carpetas con el mundo.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} bg-background antialiased`}>
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg">
            Saltar al contenido principal
          </a>
          <div className="grid h-svh grid-rows-[auto_1fr] pt-[env(safe-area-inset-top)]">
            <Header />
            <main id="main-content" tabIndex={-1} className="overflow-y-auto outline-none">{children}</main>
          </div>
          <BottomNav />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
