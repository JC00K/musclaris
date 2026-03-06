/**
 * Email Provider Interface
 *
 * Abstracts email sending so the provider can be swapped
 * without touching routes or business logic.
 * Resend is the current implementation.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<EmailResult>;
}

export interface NotificationData {
  sessionId: string;
  token: string;
  slotNumber: number;
  scheduledTime: string;
  sessionType: "physical" | "mental";
  muscleGroupsCovered: string[];
}
