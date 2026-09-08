"use client";

import React from "react";

export interface IdleTimerProps {
  remainingTime: number;
  totalWarningTime: number;
}

export default function IdleTimer({
  remainingTime,
  totalWarningTime,
}: IdleTimerProps) {
  const totalSeconds = Math.max(0, Math.ceil(remainingTime / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const percentage = (remainingTime / totalWarningTime) * 100;
  const isUrgent = percentage <= 33.33;
  const isWarning = percentage <= 66.67 && !isUrgent;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
        isUrgent
          ? "border-red-200 bg-red-50 text-[#C81E1E]"
          : isWarning
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-neutral-200 bg-white text-neutral-700"
      }`}
    >
      <span className="flex h-2 w-2 rounded-full bg-current animate-pulse" />
      <span>Session timeout in</span>
      <span className="font-mono font-bold">{formattedTime}</span>
    </div>
  );
}