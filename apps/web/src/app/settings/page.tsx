import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SettingsPage from "./settings-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuracion",
  robots: { index: false, follow: false },
};

export default async function Settings() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/login");

  return <SettingsPage />;
}
