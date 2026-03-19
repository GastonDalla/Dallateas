import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import FolderDetail from "./folder-detail";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detalle de carpeta",
  robots: { index: false, follow: false },
};

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/login");

  const { id } = await params;
  return <FolderDetail id={id} />;
}
