import React from "react";

export type StatusVariant =
  | "success"
  | "warning"
  | "neutral"
  | "info"
  | "danger"
  | "pending"
  | "assigned"
  | "inactive";

export interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; dot: string }> = {
  success: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  assigned: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  warning: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  pending: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  neutral: {
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  inactive: {
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  info: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  danger: {
    bg: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

export default function StatusBadge({
  label,
  variant = "neutral",
  dot = true,
  className = "",
}: StatusBadgeProps) {
  const styles = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${styles.bg} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}

