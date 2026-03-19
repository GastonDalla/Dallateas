import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import ImportPage from "./import-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Importar vinilos",
  robots: { index: false, follow: false },
};

export default async function Import() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return <ImportPage />;
}
