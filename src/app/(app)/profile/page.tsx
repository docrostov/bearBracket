import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  if (!userId) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 px-6 py-12">
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>{" "}
          to edit your profile.
        </p>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, emoji")
    .eq("id", userId)
    .single();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          &larr; Home
        </Link>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Your profile
        </h1>
      </div>
      <ProfileForm
        initialDisplayName={profile?.display_name ?? ""}
        initialEmoji={profile?.emoji ?? null}
      />
    </main>
  );
}
