import {
  adminClient,
  emailOTPClient,
  magicLinkClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getQueryClient } from "@/utils/trpc";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    usernameClient(),
    emailOTPClient(),
    magicLinkClient(),
  ],
});

type ListUsers = Awaited<ReturnType<typeof authClient.admin.listUsers>>;
type ListSessions = Awaited<ReturnType<typeof authClient.listSessions>>;

export type AdminUser = NonNullable<ListUsers["data"]>["users"][number];
export type AccountSession = NonNullable<ListSessions["data"]>[number];

/** Ends the session and forgets what was cached for this account, so the next one here starts clean. */
export async function signOut() {
  await authClient.signOut();
  getQueryClient().clear();
}
