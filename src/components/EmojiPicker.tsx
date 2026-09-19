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
        className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 bg-white text-lg dark:border-zinc-700 dark:bg-zinc-950"
        aria-label="Choose an emoji"
      >
        {value ?? (
          <span className="text-zinc-400 dark:text-zinc-600">＋</span>
        )}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-64 rounded-md border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
              className="mt-2 w-full rounded-md border border-zinc-200 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
