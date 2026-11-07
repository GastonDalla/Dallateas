import { z } from "zod";

/** Ids Prisma generates for our own models. */
export const recordId = z.string().min(1).max(30);

/** Better Auth issues 32-character user ids, so they cannot share the shorter limit. */
export const userId = z.string().min(1).max(64);

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Accepts links typed without a scheme, the way people copy them from a browser bar. */
function withScheme(value: string) {
  const trimmed = value.trim();
  return SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns a value stored before links were validated as a usable link, or null. */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = withScheme(value);
  return isHttpUrl(candidate) ? candidate : null;
}

export const httpUrl = (maxLength = 500) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .transform(withScheme)
    .refine(isHttpUrl, "Ingresá un link válido (http o https)");

export const optionalHttpUrl = (maxLength = 500) => z.union([z.literal(""), httpUrl(maxLength)]).optional();

/** A photo taken in the app. The client downsizes it first, so it stays small enough to store inline. */
const capturedCover = z
  .string()
  .max(200_000)
  .regex(/^data:image\/(jpeg|webp);base64,[A-Za-z0-9+/=]+$/);

export const dateString = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida");

export const vinylInput = z.object({
  title: z.string().trim().min(1).max(500),
  artist: z.string().trim().min(1).max(500),
  label: z.string().trim().max(500).optional(),
  genre: z.string().trim().max(100).optional(),
  style: z.string().trim().max(200).optional(),
  bpm: z.number().int().positive().max(999).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  discogsId: z.string().max(50).optional(),
  barcode: z.string().trim().max(50).optional(),
  coverUrl: z.union([httpUrl(2000), capturedCover]).optional(),
  notes: z.string().trim().max(5000).optional(),
  mixNotes: z.string().trim().max(5000).optional(),
  pricePaid: z.number().min(0).max(999_999).optional(),
});

export const trackInput = z.object({
  side: z.string().trim().min(1).max(10),
  position: z.number().int().min(0).max(1000),
  title: z.string().trim().min(1).max(500),
  duration: z.string().trim().max(20).optional(),
});

export const folderInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(["GENRE", "SET", "OTHER"]),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  visibility: z.enum(["PUBLIC", "ACCOUNT", "PRIVATE"]).optional(),
  // Omitted keeps the current password, null removes it, a string replaces it.
  password: z.string().trim().min(4, "La contraseña necesita al menos 4 caracteres").max(100).nullable().optional(),
});

export const collaboratorRole = z.enum(["VIEWER", "CONTRIBUTOR", "EDITOR", "ADMIN"]);

export const tagName = z.string().trim().min(1).max(50);

export const socialLink = z.object({
  platform: z.string().max(50),
  url: httpUrl(),
  label: z.string().trim().max(50).optional(),
});

export const mixLink = z.object({
  title: z.string().trim().max(200),
  url: httpUrl(),
});

export const profileSlug = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Solo letras minúsculas, números y guiones");

/** Parses a JSON list column, dropping entries that no longer match instead of failing the page. */
export function parseJsonList<T>(raw: string | null, item: z.ZodType<T>): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const result = item.safeParse(entry);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}
