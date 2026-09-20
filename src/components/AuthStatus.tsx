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
        className="text-sm font-medium text-ink-soft hover:text-ink"
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
    <div className="flex min-w-0 items-center gap-3">
      <Link
        href="/profile"
        className="max-w-[140px] truncate text-sm text-ink-soft hover:text-ink sm:max-w-none"
      >
        {profile?.emoji && <span className="mr-1">{profile.emoji}</span>}
        {profile?.display_name ?? "Bear fan"}
      </Link>
      <SignOutButton />
    </div>
  );
}
