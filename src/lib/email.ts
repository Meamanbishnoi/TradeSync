import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: "TradeSync <onboarding@resend.dev>",
    to: email,
    subject: "Verify your TradeSync account",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 20px; font-weight: 700; color: #37352f;">TradeSync</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; color: #37352f; margin: 0 0 12px;">Verify your email</h1>
        <p style="font-size: 16px; color: rgba(55,53,47,0.65); margin: 0 0 32px; line-height: 1.6;">
          Click the button below to verify your email address and activate your account. This link expires in 24 hours.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #37352f; color: #ffffff; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 6px; text-decoration: none;">
          Verify Email
        </a>
        <p style="font-size: 13px; color: rgba(55,53,47,0.45); margin: 32px 0 0; line-height: 1.5;">
          If you didn't create a TradeSync account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
