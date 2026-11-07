const BROWSERS: [RegExp, string][] = [
  [/\bEdg(e|A|iOS)?\//, "Edge"],
  [/\bOPR\//, "Opera"],
  [/\bFirefox\/|\bFxiOS\//, "Firefox"],
  [/\bChrome\/|\bCriOS\//, "Chrome"],
  [/\bSafari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/\b(iPhone|iPad)\b/, "iOS"],
  [/\bAndroid\b/, "Android"],
  [/\bWindows\b/, "Windows"],
  [/\bMac OS X\b/, "macOS"],
  [/\bLinux\b/, "Linux"],
];

function firstMatch(table: [RegExp, string][], userAgent: string) {
  return table.find(([pattern]) => pattern.test(userAgent))?.[1];
}

/** A readable name for a session's browser. Order matters: Edge and Opera also say Chrome, and phones also say Mac or Linux. */
export function describeDevice(userAgent: string | null | undefined) {
  if (!userAgent) return { label: "Dispositivo desconocido", mobile: false };

  const browser = firstMatch(BROWSERS, userAgent) ?? "Navegador desconocido";
  const system = firstMatch(SYSTEMS, userAgent);
  return {
    label: system ? `${browser} en ${system}` : browser,
    mobile: /mobile|android|iphone|ipad/i.test(userAgent),
  };
}
