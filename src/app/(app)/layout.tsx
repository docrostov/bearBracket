import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthStatus from "@/components/AuthStatus";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [{ data: claims }, { data: competition }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase
      .from("competitions")
      .select("slug")
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const userId = claims?.claims.sub;
  const slug = competition?.slug;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border-strong bg-header px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/transbearant.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="font-heading text-lg font-bold text-ink">
            bearBracket
          </span>
        </Link>
        <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-medium text-ink-soft sm:order-none sm:w-auto sm:justify-start">
          {slug && (
            <>
              <Link href={`/competitions/${slug}/results`} className="hover:text-ink">
                Results
              </Link>
              <Link href={`/competitions/${slug}/leaderboard`} className="hover:text-ink">
                Leaderboard
              </Link>
              {userId && (
                <Link href={`/competitions/${slug}/bracket`} className="hover:text-ink">
                  My Bracket
                </Link>
              )}
            </>
          )}
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
        </nav>
        <AuthStatus />
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
