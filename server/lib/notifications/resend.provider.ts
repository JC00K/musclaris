/**
 * Resend Email Provider
 *
 * Implements EmailProvider using the Resend SDK.
 * Swap this file to switch to SendGrid, SES, etc.
 */

import { Resend } from "resend";
import type { EmailProvider, EmailPayload, EmailResult } from "./types";

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Musclaris <noreply@musclaris.com>";

export function createResendProvider(): EmailProvider {
  const resend = new Resend(process.env.RESEND_API_KEY);

  return {
    async send(payload: EmailPayload): Promise<EmailResult> {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_ADDRESS,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });

        if (error) {
          return { success: false, messageId: null, error: error.message };
        }

        return { success: true, messageId: data?.id ?? null, error: null };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Email send failed.";
        return { success: false, messageId: null, error: message };
      }
    },
  };
}
