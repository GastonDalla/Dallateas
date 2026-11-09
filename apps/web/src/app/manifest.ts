import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dallateas",
    short_name: "Dallateas",
    description:
      "BPM por track, tonalidad y pitch para mezclar en bandejas.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    categories: ["music", "entertainment", "lifestyle"],
    background_color: "#121211",
    theme_color: "#121211",
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
