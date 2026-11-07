import type { Metadata } from "next";

import { Hero } from "@/components/landing/hero";
import type { LandingAction } from "@/components/landing/landing-action";
import { LandingFooter } from "@/components/landing/landing-footer";
import { MixSection } from "@/components/landing/mix-section";
import { ReplyCard } from "@/components/landing/reply-card";
import { SetFlowSection } from "@/components/landing/set-flow-section";
import { SharedSection } from "@/components/landing/shared-section";
import { TempoSheets } from "@/components/landing/tempo-sheets";
import { getSession } from "@/server/session";

import { socialCard } from "./batea/seo";

const TITLE = "Dallateas: tu batea con el BPM de cada corte";
const DESCRIPTION =
  "Guardá el BPM y la tonalidad de cada corte de tus vinilos, mirá cómo los mueve el pitch y armá sets que se puedan mezclar en bandejas.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  ...socialCard({ title: TITLE, description: DESCRIPTION }),
};

export default async function HomePage() {
  const session = await getSession();
  const signedIn = Boolean(session?.user.emailVerified);
  const action: LandingAction = signedIn
    ? { href: "/dashboard", label: "Ir a mi colección" }
    : { href: "/register", label: "Armá tu batea" };

  return (
    <div className="dark bg-background text-foreground">
      <Hero action={action} />
      <TempoSheets />
      <MixSection />
      <SetFlowSection />
      <SharedSection />
      <div>
        <ReplyCard action={action} signedIn={signedIn} />
        <LandingFooter />
      </div>
    </div>
  );
}
