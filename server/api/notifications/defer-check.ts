/**
 * Deferral Check (Cron Endpoint)
 *
 * Called by Vercel Cron every minute. Finds sessions that
 * were notified over 1 minute ago with no response and
 * auto-defers them.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { success, error } from "../../lib/response";
import { supabase } from "../../lib/supabase";

const CRON_SECRET = process.env.CRON_SECRET;
const DEFER_AFTER_MINUTES = 1;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return error(res, "Unauthorized.", 401);
  }

  try {
    const cutoff = new Date(
      Date.now() - DEFER_AFTER_MINUTES * 60 * 1000,
    ).toISOString();

    /* Find sessions notified but not responded to within the timeout */
    const { data: stale, error: queryError } = await supabase
      .from("sessions")
      .select("id, scheduled_time")
      .eq("status", "notified")
      .lt("notification_sent_at", cutoff);

    if (queryError) {
      return error(res, `Query failed: ${queryError.message}`, 500);
    }

    if (!stale || stale.length === 0) {
      return success(res, { deferred: 0 });
    }

    const deferred = [];

    for (const session of stale) {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({
          status: "deferred",
          deferred_from: session.scheduled_time,
          notification_token: null,
        })
        .eq("id", session.id);

      if (!updateError) {
        deferred.push(session.id);
      }
    }

    return success(res, { deferred: deferred.length, sessionIds: deferred });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Defer check failed.";
    return error(res, message, 500);
  }
}
