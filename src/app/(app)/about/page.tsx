export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-ink">About</h1>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          A note from Aaron
        </h2>
        {/* TODO(Aaron): replace with your own note. */}
        <p className="text-sm text-ink-soft">
          I built bearBracket for friends and family to build, save, and
          compare Fat Bear Week brackets without needing a big form or a
          spreadsheet. Have fun with it, and good luck picking a winner.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Resources for filling out your bracket
        </h2>
        {/* TODO(Aaron): replace with your own links. */}
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <a
              href="https://explore.org/fat-bear-week"
              target="_blank"
              rel="noreferrer"
              className="text-ink underline hover:text-ink-soft"
            >
              Explore.org: Fat Bear Week
            </a>
          </li>
          <li>
            <a
              href="https://explore.org/live-cams/player/brooks-falls"
              target="_blank"
              rel="noreferrer"
              className="text-ink underline hover:text-ink-soft"
            >
              Brooks Falls live cam
            </a>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted">
        <p>
          Fat Bear Week is &copy; 2026 Explore Annenberg LLC. This site isn&apos;t
          affiliated with or connected to Explore.org in any way.
        </p>
      </section>
    </main>
  );
}
