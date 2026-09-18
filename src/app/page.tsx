import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, slug, name, year, status")
    .order("year", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Competitions
      </h1>

      {!competitions || competitions.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No competitions yet. Sign in to see anything here once one&apos;s
          been added.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {competitions.map((competition) => (
            <li
              key={competition.id}
              className="rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="font-medium text-zinc-950 dark:text-zinc-50">
                {competition.name}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {competition.year} &middot; {competition.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
