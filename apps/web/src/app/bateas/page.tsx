import type { Metadata } from "next";

import BateasBrowser from "./bateas-browser";

export const metadata: Metadata = {
  title: "Explorar bateas",
  description: "Descubri colecciones publicas de vinilos de la comunidad. Explora bateas, sets y generos de DJs de todo el mundo.",
};

export default function BateasPage() {
  return <BateasBrowser />;
}
