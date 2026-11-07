import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@dallateas/env/server";

const COOKIE_NAME = "dallateas_signup";
const MAX_AGE_SECONDS = 60 * 60 * 24;

function signature(userId: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(`sign-up-proof.${userId}`).digest("base64url");
}

/** Names the browser that chose an account's password. */
export function signUpProofCookie(userId: string) {
  return {
    name: COOKIE_NAME,
    value: `${userId}.${signature(userId)}`,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    },
  };
}

export function hasSignUpProof(cookieHeader: string | null | undefined, userId: string) {
  const cookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;

  const [cookieUserId, cookieSignature] = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)).split(".");
  if (cookieUserId !== userId || !cookieSignature) return false;

  const expected = Buffer.from(signature(userId));
  const actual = Buffer.from(cookieSignature);
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
