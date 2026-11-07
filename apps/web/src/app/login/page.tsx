import type { Metadata } from "next";
import { redirect } from "next/navigation";

import SignInForm from "@/components/sign-in-form";
import { getSession } from "@/server/session";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [session, { mode, email, error }] = await Promise.all([getSession(), searchParams]);
  if (session?.user) redirect("/dashboard");

  return (
    <SignInForm
      initialMode={mode === "code" ? "code" : "password"}
      initialEmail={typeof email === "string" ? email : ""}
      linkFailed={error === "link"}
    />
  );
}
