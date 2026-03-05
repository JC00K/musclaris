/**
 * Send Notification
 *
 * Generates a token, stores it on the session, and sends
 * the notification email. Called by the cron scheduler.
 */

import { supabase } from "../supabase";
import { generateToken } from "../tokens";
import { createResendProvider } from "./resend.provider";
import { workoutNotificationEmail } from "./templates";
import type { NotificationData, EmailResult } from "./types";

const emailProvider = createResendProvider();

export async function sendSessionNotification(
  sessionId: string,
  userEmail: string,
  slotNumber: number,
  scheduledTime: string,
  sessionType: "physical" | "mental",
  muscleGroupsCovered: string[],
): Promise<EmailResult> {
  const token = generateToken();

  /* Store token and mark session as notified */
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      notification_token: token,
      notification_sent_at: new Date().toISOString(),
      status: "notified",
    })
    .eq("id", sessionId);

  if (updateError) {
    return {
      success: false,
      messageId: null,
      error: `Failed to update session: ${updateError.message}`,
    };
  }

  const data: NotificationData = {
    sessionId,
    token,
    slotNumber,
    scheduledTime,
    sessionType,
    muscleGroupsCovered,
  };

  const { subject, html, text } = workoutNotificationEmail(data);

  return emailProvider.send({ to: userEmail, subject, html, text });
}
