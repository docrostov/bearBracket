"use client";

export interface ContestantOption {
  id: string;
  name: string;
  seed: number | null;
  image_url: string | null;
}

// A handful of muted, earthy background colors to tell placeholder bears
// apart at a glance until real photos exist, picked deterministically from
// the name so the same bear always gets the same color.
const PLACEHOLDER_COLORS = [
  "bg-[#e8c79a]",
  "bg-[#e3b48d]",
  "bg-[#d9a7a0]",
  "bg-[#c6c08a]",
  "bg-[#9fbfb0]",
  "bg-[#a9bfc9]",
];

function placeholderColor(seed: string): string {
  const sum = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PLACEHOLDER_COLORS[sum % PLACEHOLDER_COLORS.length];
}

interface ContestantCardProps {
  option: ContestantOption | null;
  isPicked: boolean;
  /** Whether a pick exists for this matchup at all — used to dim the side that wasn't picked, so the actual pick reads clearly at a glance. */
  hasPick: boolean;
  disabled: boolean;
  isPending: boolean;
  /** Shown in place of a name when option is null — "TBD" for an unresolved future round, "Bye" for a first-round bye. */
  emptyLabel?: string;
  onSelect: () => void;
}

export default function ContestantCard({
  option,
  isPicked,
  hasPick,
  disabled,
  isPending,
  emptyLabel = "TBD",
  onSelect,
}: ContestantCardProps) {
  const isDimmed = hasPick && !isPicked;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`group flex flex-col gap-1.5 rounded-md border p-1.5 transition-all ${
        isPicked ? "border-[3px] border-ink" : "border-border"
      } ${option === null ? "cursor-default" : ""} ${
        isPending ? "opacity-70" : ""
      } ${isDimmed ? "opacity-50" : ""}`}
    >
      {/* Official Fat Bear Week comparison photos run ~5:2 (two side-by-side
          shots baked into one image) — this ratio keeps them legible instead
          of cropping into a headshot-style circle. */}
      <div className="relative aspect-[5/2] w-full overflow-hidden rounded bg-surface-alt">
        {option?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={option.image_url}
            alt={option.name}
            className={`h-full w-full object-cover transition-all duration-200 ease-out group-hover:scale-105 ${
              isDimmed ? "grayscale" : ""
            }`}
          />
        ) : option ? (
          <div
            className={`flex h-full w-full items-center justify-center text-3xl ${placeholderColor(option.name)} ${
              isDimmed ? "grayscale" : ""
            }`}
          >
            <span aria-hidden>🐻</span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center" />
        )}
        {isPicked && (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">
            ✓
          </span>
        )}
      </div>
      <span
        className={`text-sm ${
          isPicked
            ? "font-medium text-ink"
            : option
              ? "text-ink-soft"
              : "italic text-muted"
        }`}
      >
        {option ? `${option.seed ? `#${option.seed} ` : ""}${option.name}` : emptyLabel}
      </span>
    </button>
  );
}
