import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { authErrorMessage, fieldErrors, unwrap } from "./form-errors";

describe("fieldErrors", () => {
  const schema = z.object({
    email: z.string().min(1, "Ingresá tu email").email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
  });

  test("keeps the first message of each field", () => {
    const result = schema.safeParse({ email: "", password: "corta" });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toEqual({ email: "Ingresá tu email", password: "Mínimo 8 caracteres" });
  });

  test("reads a refinement on another field by its path", () => {
    const matching = z
      .object({ password: z.string(), confirm: z.string() })
      .refine((value) => value.password === value.confirm, { message: "No coinciden", path: ["confirm"] });
    const result = matching.safeParse({ password: "a", confirm: "b" });
    expect(fieldErrors(result.error!)).toEqual({ confirm: "No coinciden" });
  });
});

describe("authErrorMessage", () => {
  test("translates the codes people run into", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" }, "Error")).toBe("Email o contraseña incorrectos");
    expect(authErrorMessage({ code: "INVALID_OTP" }, "Error")).toBe("Código incorrecto");
    expect(authErrorMessage({ code: "OTP_EXPIRED" }, "Error")).toBe("El código venció. Pedí uno nuevo");
    expect(authErrorMessage({ code: "USERNAME_IS_ALREADY_TAKEN" }, "Error")).toBe("Ese nombre de usuario ya está en uso");
  });

  test("says when the limit was hit, whatever the code", () => {
    expect(authErrorMessage({ status: 429 }, "Error")).toBe("Demasiados intentos. Esperá un minuto");
  });

  test("falls back instead of showing an unknown English message", () => {
    expect(authErrorMessage({ code: "SOMETHING_NEW", message: "Something went wrong" }, "No se pudo guardar")).toBe(
      "No se pudo guardar",
    );
    expect(authErrorMessage(null, "No se pudo guardar")).toBe("No se pudo guardar");
  });
});

describe("unwrap", () => {
  test("returns the data of a successful call", () => {
    expect(unwrap({ data: { total: 3 }, error: null }, "Error")).toEqual({ total: 3 });
  });

  test("throws the translated message of a failed call", () => {
    expect(() => unwrap({ data: null, error: { code: "INVALID_OTP" } }, "Error")).toThrow("Código incorrecto");
  });

  test("throws the fallback when a call returns nothing", () => {
    expect(() => unwrap({ data: null, error: null }, "No se pudo cargar")).toThrow("No se pudo cargar");
  });
});
