import prisma from "@dallateas/db";
import { env } from "@dallateas/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
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

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: env.DB_PROVIDER ?? "sqlite",
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
      maxAge: 60 * 5,
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
    window: 60,
    max: 30,
  },

  advanced: {
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
      expiresIn: 600,
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
