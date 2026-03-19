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

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5efe6;font-family:'Georgia',serif;">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(44,24,16,0.08);">
<div style="background:#2c1810;padding:24px 32px;text-align:center;">
<h1 style="margin:0;color:#f5efe6;font-size:28px;letter-spacing:1px;">Dallateas</h1>
</div>
<div style="padding:32px;">${content}</div>
<div style="padding:16px 32px;background:#faf7f2;text-align:center;border-top:1px solid #ede8df;">
<p style="margin:0;color:#8a7a6b;font-size:12px;">Dallateas — Tu coleccion de vinilos</p>
</div>
</div>
</body>
</html>`;
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
    "sign-in": "Codigo de acceso",
    "email-verification": "Verifica tu email",
    "forget-password": "Recupera tu contrasena",
  };
  const descriptions: Record<string, string> = {
    "sign-in": "Usa este codigo para ingresar a tu cuenta.",
    "email-verification": "Usa este codigo para verificar tu direccion de email.",
    "forget-password": "Usa este codigo para restablecer tu contrasena.",
  };
  return baseTemplate(`
    <h2 style="margin:0 0 8px;color:#2c1810;font-size:22px;">${titles[type] ?? "Codigo de verificacion"}</h2>
    <p style="margin:0 0 24px;color:#6b5d4f;font-size:14px;line-height:1.5;">${descriptions[type] ?? "Usa este codigo:"}</p>
    <div style="text-align:center;margin:24px 0;">
      <span class="otp" style="display:inline-block;background:#2c1810;color:#f5efe6;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:8px;">${otp}</span>
    </div>
    <p style="margin:24px 0 0;color:#8a7a6b;font-size:12px;text-align:center;">Este codigo expira en 10 minutos. Si no solicitaste esto, ignora este email.</p>
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
    <h2 style="margin:0 0 8px;color:#2c1810;font-size:22px;">Ingresa a tu cuenta</h2>
    <p style="margin:0 0 24px;color:#6b5d4f;font-size:14px;line-height:1.5;">Hace click en el boton para ingresar a Dallateas sin contrasena.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${safeUrl}" style="display:inline-block;background:#2c1810;color:#f5efe6;font-size:16px;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;">Ingresar a Dallateas</a>
    </div>
    <p style="margin:24px 0 0;color:#8a7a6b;font-size:12px;text-align:center;">Este link expira en 10 minutos. Si no solicitaste esto, ignora este email.</p>
  `);
}
