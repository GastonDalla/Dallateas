import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import StatsPage from "./stats-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estadisticas",
  robots: { index: false, follow: false },
};

export default async function Stats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return <StatsPage />;
}
