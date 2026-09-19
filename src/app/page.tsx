import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SplashPage() {
  const supabase = await createClient();

  const [{ data: claims }, { data: competition }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase
      .from("competitions")
      .select("slug, name")
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const userId = claims?.claims.sub;
  const slug = competition?.slug;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-border-strong bg-surface p-8 text-center shadow-sm sm:p-12">
        <Image
          src="/bearbracket-logo.png"
          alt="bearBracket"
          width={480}
          height={155}
          className="h-auto w-full max-w-sm"
          priority
        />

        {/* TODO(Aaron): replace with your own welcome note. */}
        <p className="text-sm text-ink-soft">
          Build your bracket, track how it holds up against the real thing,
          and see how you stack up against everyone else picking along with
          you.
        </p>

        <div className="flex w-full flex-col gap-3 pt-2">
          {slug && (
            <>
              <Link
                href={userId ? `/competitions/${slug}/bracket` : "/login"}
                className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:opacity-90"
              >
                {userId ? "My Bracket" : "Sign in to get started"}
              </Link>
              <div className="flex justify-center gap-4 text-sm font-medium text-ink-soft">
                <Link href={`/competitions/${slug}/results`} className="hover:text-ink">
                  Results
                </Link>
                <Link href={`/competitions/${slug}/leaderboard`} className="hover:text-ink">
                  Leaderboard
                </Link>
                <Link href="/about" className="hover:text-ink">
                  About
                </Link>
              </div>
            </>
          )}
          {!slug && (
            <Link href="/about" className="text-sm font-medium text-ink-soft hover:text-ink">
              About
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
