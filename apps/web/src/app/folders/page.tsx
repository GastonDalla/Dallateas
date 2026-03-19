import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import FoldersPageClient from "./pageClient";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis carpetas",
  robots: { index: false, follow: false },
};

export default async function FoldersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return <FoldersPageClient />;
}

