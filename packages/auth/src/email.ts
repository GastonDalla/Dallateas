import { env } from "@dallateas/env/server";
import nodemailer from "nodemailer";

const transporter =
  env.GMAIL_USER && env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.GMAIL_USER,
          pass: env.GMAIL_APP_PASSWORD,
        },
      })
    : null;

const INK = "#161615";
const PAPER = "#FFFFFF";
const FLUO = "#FF5B14";
const MUTED = "#5E5E59";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Tables and inline styles, because that is all that survives Outlook and Gmail. */
function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>Dallateas</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${INK};font-family:${SANS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:480px;">
<tr><td style="background:${INK};color:${PAPER};padding:16px 24px;font-family:${SANS};font-size:18px;font-weight:700;">Dallateas</td></tr>
<tr><td style="padding:32px 24px;font-family:${SANS};">${content}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid ${INK};color:${MUTED};font-family:${SANS};font-size:12px;">Dallateas, tu colección de vinilos</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;color:${INK};font-size:24px;line-height:1.2;font-weight:700;">${text}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 24px;color:${INK};font-size:16px;line-height:1.5;">${text}</p>`;
}

function footnote(text: string) {
  return `<p style="margin:24px 0 0;color:${MUTED};font-size:13px;line-height:1.5;">${text}</p>`;
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    if (env.NODE_ENV === "development") {
      const otpMatch = html.match(/class="otp"[^>]*>(\d+)</);
      if (otpMatch) console.log(`[EMAIL] OTP: ${otpMatch[1]}`);
      const urlMatch = html.match(/href="([^"]+)"[^>]*>.*[Ii]ngresar/);
      if (urlMatch) console.log(`[EMAIL] Magic Link: ${urlMatch[1]}`);
    }
    return;
  }

  await transporter.sendMail({
    from: `"Dallateas" <${env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export function otpEmailHtml(otp: string, type: string) {
  const titles: Record<string, string> = {
    "sign-in": "Tu código de acceso",
    "email-verification": "Verificá tu email",
    "forget-password": "Recuperá tu contraseña",
  };
  const descriptions: Record<string, string> = {
    "sign-in": "Usá este código para ingresar a tu cuenta",
    "email-verification": "Usá este código para verificar tu email",
    "forget-password": "Usá este código para restablecer tu contraseña",
  };
  return baseTemplate(`
    ${heading(titles[type] ?? "Tu código de verificación")}
    ${paragraph(descriptions[type] ?? "Usá este código")}
    <span class="otp" style="display:inline-block;background:${FLUO};color:${INK};font-size:32px;font-weight:700;letter-spacing:6px;padding:12px 20px;border-radius:2px;">${otp}</span>
    ${footnote("Vence en 10 minutos. Si no lo pediste, ignorá este email")}
  `);
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c] ?? c;
  });
}

export function magicLinkEmailHtml(url: string) {
  const safeUrl = escapeHtml(url);
  return baseTemplate(`
    ${heading("Ingresá a tu cuenta")}
    ${paragraph("Tocá el botón para entrar a Dallateas sin contraseña")}
    <a href="${safeUrl}" style="display:inline-block;background:${FLUO};color:${INK};font-size:16px;font-weight:700;padding:14px 24px;border-radius:4px;text-decoration:none;">Ingresar a Dallateas</a>
    ${footnote("Este link vence en 5 minutos. Si no lo pediste, ignorá este email")}
  `);
}
