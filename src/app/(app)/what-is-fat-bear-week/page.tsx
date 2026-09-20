export default function WhatIsFatBearWeekPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-ink">
          What&apos;s Fat Bear Week?
        </h1>
      </div>

      <section className="flex flex-col gap-3">
        <p className="text-sm text-ink-soft">
          Fat Bear Week is a yearly event at{" "}
          <span className="font-medium text-ink">Katmai National Park</span>{" "}
          in Alaska. Katmai has unusually rich conditions for salmon
          breeding, so every fall, bears from all over Alaska and the
          Canadian northwest flock there for their fill of all-you-can-eat
          salmon before their winter hibernation.
        </p>
        <p className="text-sm text-ink-soft">
          Every year, the park publishes a bracket featuring the bears they
          feel have packed on the most pounds among the park&apos;s tubby
          guests. On their website, people vote round by round on which
          bear has become the most roly-poly chunkster of the year.
        </p>
        <p className="text-sm text-ink-soft">
          Basically, it&apos;s like March Madness, but instead of
          basketball, it&apos;s about which bear has eaten the most salmon!
          (Yum, I assume!)
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Want to go down a rabbit hole?
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <a
              href="https://www.theguardian.com/us-news/2022/oct/11/alaska-fat-bear-week-voting-scandal"
              target="_blank"
              rel="noreferrer"
              className="text-ink underline hover:text-ink-soft"
            >
              The 2022 Fat Bear Week voting scandal
            </a>
            , courtesy of The Guardian &mdash; yes, someone tried to rig it.
          </li>
          <li>
            <a
              href="https://www.mentalfloss.com/animals/fat-bear-week-history"
              target="_blank"
              rel="noreferrer"
              className="text-ink underline hover:text-ink-soft"
            >
              A history of Fat Bear Week
            </a>{" "}
            from Mental Floss, including interviews with Mike Fitz, the
            former park ranger who created it.
          </li>
        </ul>
      </section>
    </main>
  );
}
