/**
 * Theme Sync
 *
 * Syncs theme preference between the local theme store
 * and Supabase user_profiles. Called after login and
 * when the user changes their preference while logged in.
 */

import { supabase } from "./supabase";
import { useThemeStore } from "../store/themeStore";
import type { ThemePreference } from "../store/themeStore";

/** Pull theme preference from Supabase and apply locally */
export async function pullThemeFromSupabase(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("theme_preference")
    .eq("id", userId)
    .single();

  if (error || !data) return;

  const remotePref = data.theme_preference as ThemePreference;
  const { preference, setPreference } = useThemeStore.getState();

  /* Remote wins if local is still on default */
  if (preference === "system" && remotePref !== "system") {
    setPreference(remotePref);
  }
}

/** Push local theme preference to Supabase */
export async function pushThemeToSupabase(
  userId: string,
  pref: ThemePreference,
): Promise<void> {
  await supabase
    .from("user_profiles")
    .update({ theme_preference: pref })
    .eq("id", userId);
}
