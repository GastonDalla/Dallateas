import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dallateas",
    short_name: "Dallateas",
    description:
      "Organiza tu coleccion de vinilos en bateas, arma tus sets y comparti tus carpetas.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    categories: ["music", "entertainment", "lifestyle"],
    background_color: "#f5efe6",
    theme_color: "#2c1810",
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
