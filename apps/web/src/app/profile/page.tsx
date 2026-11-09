import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileEditor } from "@/components/profile/profile-editor";
import { ProfileEditorSkeleton } from "@/components/profile/profile-editor-skeleton";
import { requireSession } from "@/server/session";
import { HydrateClient, prefetch, serverTrpc } from "@/server/trpc";

export const metadata: Metadata = {
  title: "Perfil DJ",
  robots: { index: false, follow: false },
};

export default async function Profile() {
  const { user } = await requireSession();
  await prefetch(serverTrpc.djProfileGet.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={<ProfileEditorSkeleton />}>
        <ProfileEditor username={user.username ?? null} />
      </Suspense>
    </HydrateClient>
  );
}
