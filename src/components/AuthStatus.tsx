import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function AuthStatus() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (!userId) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Sign in
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, emoji")
    .eq("id", userId)
    .single();

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="text-sm text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
      >
        {profile?.emoji && <span className="mr-1">{profile.emoji}</span>}
        {profile?.display_name ?? "Bear fan"}
      </Link>
      <SignOutButton />
    </div>
  );
}
