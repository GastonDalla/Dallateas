import prisma from "@dallateas/db";
import { env } from "@dallateas/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  emailOTP,
  haveIBeenPwned,
  magicLink,
  username,
} from "better-auth/plugins";

import {
  magicLinkEmailHtml,
  otpEmailHtml,
  sendEmail,
} from "./email";

/** How long a sign-up code stays valid. An unverified account older than this has been abandoned. */
const VERIFICATION_WINDOW_SECONDS = 600;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  appName: "Dallateas",
  trustedOrigins: [env.CORS_ORIGIN],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      // Short, because a ban or role change only lands once this cached session expires.
      maxAge: 60,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["email-password"],
    },
  },

  user: {
    changeEmail: { enabled: true },
    deleteUser: { enabled: true },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/sign-in/magic-link": { window: 60, max: 3 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/forget-password/email-otp": { window: 60, max: 3 },
    },
  },

  hooks: {
    // Someone can register a stranger's email and wait. If the stranger later verified it, the
    // attacker's password would still open the account. A new sign-up replaces an abandoned,
    // unverified account, so the password that survives belongs to whoever proves the email.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email" || typeof ctx.body?.email !== "string") return;
      await prisma.user.deleteMany({
        where: {
          email: ctx.body.email.toLowerCase(),
          emailVerified: false,
          createdAt: { lt: new Date(Date.now() - VERIFICATION_WINDOW_SECONDS * 1000) },
        },
      });
    }),
  },

  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"],
    },
    useSecureCookies: env.NODE_ENV === "production",
    disableCSRFCheck: false,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    },
    cookiePrefix: "dallateas",
  },

  plugins: [
    admin({ defaultRole: "user" }),
    username(),
    emailOTP({
      otpLength: 6,
      expiresIn: VERIFICATION_WINDOW_SECONDS,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const subjects: Record<string, string> = {
          "sign-in": "Tu codigo de acceso — Dallateas",
          "email-verification": "Verifica tu email — Dallateas",
          "forget-password": "Recupera tu contrasena — Dallateas",
        };
        await sendEmail(
          email,
          subjects[type] ?? "Codigo de verificacion — Dallateas",
          otpEmailHtml(otp, type),
        );
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail(
          email,
          "Tu link de acceso — Dallateas",
          magicLinkEmailHtml(url),
        );
      },
    }),
    haveIBeenPwned(),
    nextCookies(), 
  ],
});
