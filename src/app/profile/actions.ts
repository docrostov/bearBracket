"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Matches the emoji_shape CHECK in 0006_profile_display_constraints.sql —
// not an attempt to validate "this is a real emoji," just a guard against
// the field being used as a second unconstrained text field.
const EMOJI_DISALLOWED = /[A-Za-z0-9@]/;

export async function updateProfile(
  displayName: string,
  emoji: string | null
): Promise<void> {
  const trimmedName = displayName.trim();

  if (trimmedName.length === 0) {
    throw new Error("Display name can't be empty.");
  }
  if (trimmedName.length > 40) {
    throw new Error("Display name is too long.");
  }
  if (trimmedName.includes("@")) {
    throw new Error("Display name can't look like an email address.");
  }

  const trimmedEmoji = emoji?.trim() || null;
  if (trimmedEmoji !== null) {
    // Count by codepoint, not UTF-16 code unit, so multi-codepoint emoji
    // (skin tones, ZWJ sequences, flags) aren't penalized for their length.
    const codepointCount = [...trimmedEmoji].length;
    if (codepointCount > 8 || EMOJI_DISALLOWED.test(trimmedEmoji)) {
      throw new Error("That doesn't look like a valid emoji.");
    }
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) {
    throw new Error("Sign in to update your profile.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmedName, emoji: trimmedEmoji })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  // The header (AuthStatus) reads display_name/emoji from the root layout.
  revalidatePath("/", "layout");
}
