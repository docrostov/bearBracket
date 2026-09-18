"use client";

export interface ContestantOption {
  id: string;
  name: string;
  seed: number | null;
  image_url: string | null;
}

// A handful of background colors to tell placeholder bears apart at a
// glance until real photos exist, picked deterministically from the name so
// the same bear always gets the same color.
const PLACEHOLDER_COLORS = [
  "bg-amber-200 dark:bg-amber-900",
  "bg-orange-200 dark:bg-orange-900",
  "bg-rose-200 dark:bg-rose-900",
  "bg-lime-200 dark:bg-lime-900",
  "bg-teal-200 dark:bg-teal-900",
  "bg-sky-200 dark:bg-sky-900",
];

function placeholderColor(seed: string): string {
  const sum = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PLACEHOLDER_COLORS[sum % PLACEHOLDER_COLORS.length];
}

interface ContestantCardProps {
  option: ContestantOption | null;
  isPicked: boolean;
  disabled: boolean;
  isPending: boolean;
  /** Shown in place of a name when option is null — "TBD" for an unresolved future round, "Bye" for a first-round bye. */
  emptyLabel?: string;
  onSelect: () => void;
}

export default function ContestantCard({
  option,
  isPicked,
  disabled,
  isPending,
  emptyLabel = "TBD",
  onSelect,
}: ContestantCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`group flex flex-col gap-1.5 rounded-md border p-1.5 transition-colors ${
        isPicked
          ? "border-zinc-950 dark:border-zinc-50"
          : "border-zinc-200 dark:border-zinc-800"
      } ${option === null ? "cursor-default" : ""} ${
        isPending ? "opacity-70" : ""
      }`}
    >
      {/* Official Fat Bear Week comparison photos run ~5:2 (two side-by-side
          shots baked into one image) — this ratio keeps them legible instead
          of cropping into a headshot-style circle. */}
      <div className="aspect-[5/2] w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900">
        {option?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={option.image_url}
            alt={option.name}
            className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
          />
        ) : option ? (
          <div
            className={`flex h-full w-full items-center justify-center text-3xl ${placeholderColor(option.name)}`}
          >
            <span aria-hidden>🐻</span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center" />
        )}
      </div>
      <span
        className={`text-sm ${
          isPicked
            ? "font-medium text-zinc-950 dark:text-zinc-50"
            : option
              ? "text-zinc-700 dark:text-zinc-300"
              : "italic text-zinc-400 dark:text-zinc-600"
        }`}
      >
        {option ? `${option.seed ? `#${option.seed} ` : ""}${option.name}` : emptyLabel}
      </span>
    </button>
  );
}
