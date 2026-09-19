"use client";

import { useEffect, useRef, useState } from "react";

// A small curated set rather than a full emoji library — this is a fun,
// low-stakes leaderboard marker, not a general-purpose picker.
const EMOJI_OPTIONS = [
  "🐻", "🐻‍❄️", "🧸", "🐾", "🍂", "🍁", "🌲", "🏔️",
  "🐟", "🎣", "😴", "💤", "🍯", "🦴", "🦆", "🦅",
  "🦉", "🐺", "🦫", "🦦", "🐿️", "🦌", "🌊", "☀️",
  "🌙", "⭐", "🔥", "🏆", "🥇", "🥈", "🥉", "🎉",
  "🎊", "🎯", "🏅", "💪", "😎", "🤩", "😂", "🥳",
  "❤️", "💛", "💚", "💙", "💜", "🧡", "🖤", "🤍",
];

export default function EmojiPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (emoji: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-lg"
        aria-label="Choose an emoji"
      >
        {value ?? <span className="text-muted">＋</span>}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-64 rounded-md border border-border bg-surface p-2 shadow-lg">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-surface-alt"
              >
                {emoji}
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-2 w-full rounded-md border border-border py-1 text-xs text-ink-soft hover:bg-surface-alt"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
