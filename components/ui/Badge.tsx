import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "danger" | "warning" | "theme";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral:
      "bg-neutral-100 text-neutral-700 border-neutral-200/80",
    success:
      "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    danger:
      "bg-red-50 text-red-700 border-red-200/60",
    warning:
      "bg-amber-50 text-amber-800 border-amber-200/60",
    theme:
      "bg-red-50 text-[#C81E1E] border-red-200/60",
  };

  const dotColors = {
    neutral: "bg-neutral-400",
    success: "bg-emerald-500",
    danger: "bg-red-500",
    warning: "bg-amber-500",
    theme: "bg-[#C81E1E]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  );
}

