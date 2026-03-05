/**
 * Notification Email Templates
 *
 * HTML templates for workout notifications.
 * Uses inline styles for email client compatibility.
 */

import type { NotificationData } from "./types";

const APP_URL = process.env.APP_URL ?? "https://musclaris.vercel.app";

function formatTime(isoTime: string): string {
  const date = new Date(isoTime);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function buildConfirmUrl(sessionId: string, token: string): string {
  return `${APP_URL}/api/schedule/confirm?sessionId=${sessionId}&token=${token}`;
}

export function buildSkipUrl(sessionId: string, token: string): string {
  return `${APP_URL}/api/schedule/skip?sessionId=${sessionId}&token=${token}`;
}

export function workoutNotificationEmail(data: NotificationData): {
  subject: string;
  html: string;
  text: string;
} {
  const time = formatTime(data.scheduledTime);
  const confirmUrl = buildConfirmUrl(data.sessionId, data.token);
  const skipUrl = buildSkipUrl(data.sessionId, data.token);

  const sessionLabel =
    data.sessionType === "mental"
      ? "Mental Wellness"
      : `Workout ${data.slotNumber}/6`;

  const muscleGroupsText =
    data.muscleGroupsCovered.length > 0
      ? `Muscle groups covered today: ${data.muscleGroupsCovered.join(", ")}`
      : "First workout of the day!";

  const subject = `Musclaris: Your ${time} ${sessionLabel} is in 5 minutes`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px;">${sessionLabel} at ${time}</h2>
      <p style="margin: 0 0 24px 0; color: #6c757d; font-size: 14px;">${muscleGroupsText}</p>

      <table role="presentation" style="width: 100%; border-spacing: 0 8px;">
        <tr>
          <td style="padding: 0;">
            <a href="${confirmUrl}" style="display: block; background-color: #1a1a2e; color: #ffffff; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Confirm
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 0;">
            <a href="${skipUrl}" style="display: block; background-color: #f8f9fa; color: #6c757d; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 1px solid #dee2e6;">
              Skip
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 24px 0 0 0; color: #adb5bd; font-size: 12px;">
        No response within 1 minute will defer this session.
        This link expires in 10 minutes.
      </p>
    </body>
    </html>
  `.trim();

  const text = [
    `${sessionLabel} at ${time}`,
    muscleGroupsText,
    "",
    `Confirm: ${confirmUrl}`,
    `Skip: ${skipUrl}`,
    "",
    "No response within 1 minute will defer this session.",
  ].join("\n");

  return { subject, html, text };
}
