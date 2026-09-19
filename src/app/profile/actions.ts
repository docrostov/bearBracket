"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(displayName: string): Promise<void> {
  const trimmed = displayName.trim();

  if (trimmed.length === 0) {
    throw new Error("Display name can't be empty.");
  }
  if (trimmed.length > 40) {
    throw new Error("Display name is too long.");
  }
  if (trimmed.includes("@")) {
    throw new Error("Display name can't look like an email address.");
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) {
    throw new Error("Sign in to update your profile.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  // The header (AuthStatus) reads display_name from the root layout.
  revalidatePath("/", "layout");
}
