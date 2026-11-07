import type { Metadata } from "next";

import { ADMIN_BATEAS_LIMIT } from "@/components/admin/admin-bateas";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdmin } from "@/server/session";
import { HydrateClient, prefetch, serverTrpc } from "@/server/trpc";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdmin();
  await prefetch(serverTrpc.adminFolders.queryOptions({ limit: ADMIN_BATEAS_LIMIT }));

  return (
    <HydrateClient>
      <AdminDashboard />
    </HydrateClient>
  );
}
