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
  /** Forced zoom, independent of hover — driven by the matchup's magnifying-glass toggle. */
  isExpanded: boolean;
  onSelect: () => void;
}

export default function ContestantCard({
  option,
  isPicked,
  disabled,
  isPending,
  isExpanded,
  onSelect,
}: ContestantCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`group relative flex flex-1 flex-col items-center gap-2 rounded-md border p-3 transition-colors ${
        isPicked
          ? "border-zinc-950 dark:border-zinc-50"
          : "border-zinc-200 dark:border-zinc-800"
      } ${option ? "hover:enabled:z-10" : "cursor-default"} ${
        isExpanded ? "z-10" : ""
      } ${isPending ? "opacity-70" : ""}`}
    >
      <div className="flex h-16 w-16 items-center justify-center">
        <div
          className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-3xl shadow-sm transition-transform duration-200 ease-out ${
            option
              ? `${placeholderColor(option.name)} group-hover:scale-[1.8] ${
                  isExpanded ? "scale-[1.8]" : ""
                }`
              : ""
          }`}
        >
          {option?.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={option.image_url}
              alt={option.name}
              className="h-full w-full object-cover"
            />
          ) : option ? (
            <span aria-hidden>🐻</span>
          ) : null}
        </div>
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
        {option ? `${option.seed ? `#${option.seed} ` : ""}${option.name}` : "TBD"}
      </span>
    </button>
  );
}
