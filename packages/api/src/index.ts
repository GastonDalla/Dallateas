import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { Context } from "./context";
import { consumeMemoryLimit } from "./rate-limit";

const UNIQUE_VIOLATION = "P2002";

export const t = initTRPC.context<Context>().create({
  // Keeps dates as dates on both sides, including data prefetched on the server.
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      // Prisma and driver messages describe the schema, so they stay in the server logs.
      console.error(error);
      return { ...shape, message: "Algo salió mal. Intentá de nuevo.", data: { ...shape.data, stack: undefined } };
    }
    if (error.cause instanceof ZodError) {
      return { ...shape, message: error.cause.issues[0]?.message ?? "Datos inválidos" };
    }
    return shape;
  },
});

export const router = t.router;
export const mergeRouters = t.mergeRouters;

const baseProcedure = t.procedure.use(async ({ next }) => {
  const result = await next();
  if (!result.ok && (result.error.cause as { code?: string } | undefined)?.code === UNIQUE_VIOLATION) {
    throw new TRPCError({ code: "CONFLICT", message: "Ese valor ya existe", cause: result.error.cause });
  }
  return result;
});

const throttled = baseProcedure.use(({ ctx, next }) => {
  const key = ctx.session?.user.id ?? ctx.ip;
  if (!consumeMemoryLimit(key, { limit: 120, windowMs: 60_000 })) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiadas solicitudes. Intentá de nuevo en un momento." });
  }
  return next();
});

export const publicProcedure = throttled;

export const protectedProcedure = throttled.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Necesitás iniciar sesión" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
  }
  return next();
});
