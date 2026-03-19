import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import VinylDetail from "./vinyl-detail";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detalle de vinilo",
  robots: { index: false, follow: false },
};

export default async function VinylPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/login");

  const { id } = await params;
  return <VinylDetail id={id} />;
}
