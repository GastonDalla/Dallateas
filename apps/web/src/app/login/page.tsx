import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SignInForm from "@/components/sign-in-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesion",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  return <SignInForm />;
}
