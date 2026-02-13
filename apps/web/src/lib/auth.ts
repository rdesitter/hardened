import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, users, accounts, sessions, verificationTokens } from '@hardened/db';

function magicLinkHtml(url: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#030712;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:8px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="32" height="32">
                <circle cx="256" cy="256" r="256" fill="#030712"/>
                <path d="M256 72 L400 136 L400 264 C400 348 336 420 256 448 C176 420 112 348 112 264 L112 136 Z" fill="none" stroke="#00c951" stroke-width="16" stroke-linejoin="round"/>
                <polyline points="196,256 236,304 316,208" fill="none" stroke="#00c951" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </td>
            <td style="vertical-align:middle;font-size:20px;font-weight:700;color:#ffffff;">
              Harden<span style="color:#00c951;">ed</span>
            </td>
          </tr></table>
        </td></tr>
        <!-- Card -->
        <tr><td style="background-color:#111827;border:1px solid #1f2937;border-radius:16px;padding:40px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;text-align:center;">
            Sign in to Hardened
          </h1>
          <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;text-align:center;line-height:1.5;">
            Click the button below to securely sign in.<br/>This link expires in 24 hours.
          </p>
          <!-- Button -->
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${url}" target="_blank" style="display:inline-block;background-color:#00c951;color:#030712;font-size:15px;font-weight:600;text-decoration:none;padding:12px 40px;border-radius:8px;">
              Sign in
            </a>
          </td></tr></table>
          <p style="margin:28px 0 0;font-size:12px;color:#6b7280;text-align:center;line-height:1.5;">
            If the button doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#4b5563;text-align:center;word-break:break-all;">
            ${url}
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.5;">
            You received this email because a sign-in was requested for this address.<br/>If you didn't request this, you can safely ignore it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? 'Hardened <noreply@hardened.app>',
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { Resend: ResendClient } = await import('resend');
        const resend = new ResendClient(process.env.RESEND_API_KEY!);
        const { error } = await resend.emails.send({
          from: provider.from!,
          to: email,
          subject: 'Sign in to Hardened',
          html: magicLinkHtml(url),
        });
        if (error) throw new Error(JSON.stringify(error));
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
