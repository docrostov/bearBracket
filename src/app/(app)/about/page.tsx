export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-ink">About</h1>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          About bearBracket
        </h2>
        <p className="text-sm text-ink-soft">
          Hello! I&apos;m Aaron. For more years than my daughter can count, I&apos;ve been holding a small competition for my coworkers, family, and friends to see who picks the best bracket for Fat Bear Week every year. Normally, the way I run the competition is through a bunch of Google Sheets magic, Google Forms, and a bunch of manual work. After many years of this, and often having people stop entering because the process was too tedious, I wanted to make things a bit easier for folks.
        </p>
        <p className="text-sm text-ink-soft">
          So... enter bearBracket! I&apos;ve been wanting to build a little app like this for years now. I think I originally made the GitHub repo for this in 2022 or something of the like. After years of telling myself I&apos;d do it next year and never actually doing it, this year finally proved to be the one. I will note, this was built with a pretty big assist from Claude Code. I know I have many friends who aren&apos;t particularly keen on AI, and I am sympathetic to many of the concerns around these tools. But man... it was a huge help here. This site would not be nearly as good without it!
        </p>
        <p className="text-sm text-ink-soft">
          Hopefully, this whole thing will make it a bit easier for folks to both enter my little competition and follow along to see how your brackets are performing against the actual results. Pretty much every single person who is using this site should know where to find me if you have any questions, so I don&apos;t really see the need to put any sort of contact info here. You know where to find me, bucko.
        </p>
        <p className="text-sm text-ink-soft">
          Oh! Also. Obligatory disclaimer: this site is not affiliated with or connected to Katmai National Park or explore.org in any way. I am just a long-time fan of Fat Bear Week. Also, secondarily: my favorite all-time bears are 89 Backpack, 435 Holly, and 409 Beadnose. Gotta stan for my favs.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Resources for filling out your bracket
        </h2>
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
              Brooks Falls live cam, to watch the bears in action (or to watch the bears&apos; inaction)
            </a>
          </li>
          <li>
            <a
              href="https://katmai-bearcams.fandom.com/wiki/Katmai_Bearcams_Wiki"
              target="_blank"
              rel="noreferrer"
              className="text-ink underline hover:text-ink-soft"
            >
              Katmai Bearcams Wiki (fan-run wiki with a surfeit of info on the chunky critters)
            </a>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted">
        <p>
          Fat Bear Week is &copy; 2026 Explore Annenberg LLC. This site is not
          affiliated with or connected to Explore.org in any way. It&apos;s just for fun!
        </p>
      </section>
    </main>
  );
}
