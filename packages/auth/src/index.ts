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

import { hasSignUpProof, signUpProofCookie } from "./sign-up-proof";
import {
  magicLinkEmailHtml,
  otpEmailHtml,
  sendEmail,
} from "./email";

const OTP_EXPIRY_SECONDS = 600;

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

  emailVerification: {
    // A code proves who owns an email, not who chose the password. Someone can register a
    // stranger's address and wait for them to verify it, so a password only survives if it was
    // set from the browser that verifies. This runs after the code is accepted, so a wrong code
    // cannot strip anyone's credential. The owner can always get in through a code or a reset.
    beforeEmailVerification: async (user, request) => {
      if (user.emailVerified || hasSignUpProof(request?.headers.get("cookie"), user.id)) return;
      await prisma.$transaction([
        prisma.account.deleteMany({ where: { userId: user.id, providerId: "credential" } }),
        prisma.session.deleteMany({ where: { userId: user.id } }),
      ]);
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const created = ctx.context.returned as { user?: { id: string } } | undefined;
      if (!created?.user) return;
      const { name, value, options } = signUpProofCookie(created.user.id);
      ctx.setCookie(name, value, options);
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
      expiresIn: OTP_EXPIRY_SECONDS,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const subjects: Record<string, string> = {
          "sign-in": "Tu código de acceso a Dallateas",
          "email-verification": "Verificá tu email en Dallateas",
          "forget-password": "Recuperá tu contraseña de Dallateas",
        };
        await sendEmail(
          email,
          subjects[type] ?? "Tu código de verificación de Dallateas",
          otpEmailHtml(otp, type),
        );
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail(
          email,
          "Tu link de acceso a Dallateas",
          magicLinkEmailHtml(url),
        );
      },
    }),
    haveIBeenPwned(),
    nextCookies(), 
  ],
});
