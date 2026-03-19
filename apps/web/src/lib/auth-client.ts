import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  magicLinkClient,
  usernameClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    usernameClient(),
    emailOTPClient(),
    magicLinkClient(),
  ],
});
