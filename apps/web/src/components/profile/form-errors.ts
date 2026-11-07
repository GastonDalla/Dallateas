type Issues = { issues: readonly { path: readonly PropertyKey[]; message: string }[] };

/** The first message of each field in a failed validation, keyed by field name. */
export function fieldErrors(error: Issues) {
  const errors: Record<string, string> = {};
  for (const { path, message } of error.issues) {
    const field = String(path[0]);
    errors[field] ??= message;
  }
  return errors;
}

type AuthError = { code?: string; status?: number; message?: string };

const AUTH_MESSAGES: Record<string, string> = {
  BANNED_USER: "Tu cuenta está suspendida",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Tu cuenta no tiene contraseña. Cerrá sesión y creá una desde Olvidé mi contraseña",
  EMAIL_NOT_VERIFIED: "Verificá tu email para continuar",
  INVALID_EMAIL: "Email inválido",
  INVALID_EMAIL_OR_PASSWORD: "Email o contraseña incorrectos",
  INVALID_OTP: "Código incorrecto",
  INVALID_PASSWORD: "La contraseña actual no es correcta",
  INVALID_USERNAME: "Solo letras, números y guiones bajos",
  OTP_EXPIRED: "El código venció. Pedí uno nuevo",
  PASSWORD_COMPROMISED: "Esa contraseña apareció en una filtración. Elegí otra",
  PASSWORD_TOO_LONG: "Máximo 128 caracteres",
  PASSWORD_TOO_SHORT: "Mínimo 8 caracteres",
  TOO_MANY_ATTEMPTS: "Demasiados intentos. Pedí un código nuevo",
  USER_ALREADY_EXISTS: "Ya hay una cuenta con ese email",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya hay una cuenta con ese email",
  USERNAME_IS_ALREADY_TAKEN: "Ese nombre de usuario ya está en uso",
  USERNAME_TOO_LONG: "Máximo 30 caracteres",
  USERNAME_TOO_SHORT: "Mínimo 3 caracteres",
  YOU_CANNOT_BAN_YOURSELF: "No podés banearte a vos",
  YOU_CANNOT_IMPERSONATE_ADMINS: "No se puede impersonar a otro admin",
  YOU_CANNOT_REMOVE_YOURSELF: "No podés eliminar tu propia cuenta desde acá",
};

/** Better Auth answers in English, so unknown codes fall back to the caller's sentence. */
export function authErrorMessage(error: AuthError | null | undefined, fallback: string) {
  if (error?.status === 429) return "Demasiados intentos. Esperá un minuto";
  return (error?.code && AUTH_MESSAGES[error.code]) || fallback;
}

/** The auth client reports failures as a value, so a query or mutation has to rethrow them. */
export function unwrap<T>(result: { data: T | null; error: AuthError | null }, fallback: string): T {
  if (result.error || result.data === null) throw new Error(authErrorMessage(result.error, fallback));
  return result.data;
}
