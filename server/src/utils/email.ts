import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_APP_PASSWORD,
  },
});

export const sendMagicLinkEmail = async (
  email: string,
  name: string,
  magicLink: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"Hostello" <${env.EMAIL_USER}>`,
    to: email,
    subject: "Your login link for Hostello",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#080912;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" style="max-width:480px;background:#1A1830;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,0.08);">
                <tr><td align="center" style="padding-bottom:32px;">
                  <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Hostello</h1>
                </td></tr>
                <tr><td>
                  <p style="margin:0 0 8px;font-size:15px;color:#B5B2D8;">Hi ${name || "there"},</p>
                  <p style="margin:0 0 32px;font-size:14px;color:#7B78A0;line-height:1.6;">
                    Click below to log in to Hostello. This link expires in <strong style="color:#A78BFA;">15 minutes</strong> and can only be used once.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center">
                      <a href="${magicLink}"
                         style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;">
                        Log in to Hostello
                      </a>
                    </td></tr>
                  </table>
                  <p style="margin:28px 0 0;font-size:12px;color:#3D3B62;text-align:center;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
};
