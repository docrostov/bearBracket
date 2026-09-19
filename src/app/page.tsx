import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, slug, name, year, status")
    .order("year", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-heading text-2xl font-bold text-ink">
        Competitions
      </h1>

      {!competitions || competitions.length === 0 ? (
        <p className="text-sm text-ink-soft">
          No competitions yet. Sign in to see anything here once one&apos;s
          been added.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {competitions.map((competition) => (
            <li key={competition.id}>
              <Link
                href={`/competitions/${competition.slug}`}
                className="block rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
              >
                <p className="font-medium text-ink">{competition.name}</p>
                <p className="text-sm text-ink-soft">
                  {competition.year} &middot; {competition.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
