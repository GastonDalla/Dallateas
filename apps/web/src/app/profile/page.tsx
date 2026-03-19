import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import ProfilePage from "./profile-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil DJ",
  robots: { index: false, follow: false },
};

export default async function Profile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/login");

  return <ProfilePage />;
}
