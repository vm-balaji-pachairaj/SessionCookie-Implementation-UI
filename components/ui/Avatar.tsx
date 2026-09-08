import React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  withRing?: boolean;
  ringColor?: "theme" | "neutral";
  status?: "online" | "offline";
}

export function Avatar({
  name = "User",
  src,
  size = "md",
  withRing = false,
  ringColor = "theme",
  status,
  className = "",
  ...props
}: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const sizeMap = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
    xl: "h-14 w-14 text-base",
  };

  const ringStyles = withRing
    ? ringColor === "theme"
      ? "p-[1.5px] bg-[#C81E1E]"
      : "p-[1.5px] bg-neutral-300"
    : "";

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} {...props}>
      <div className={`rounded-full ${ringStyles}`}>
        <div
          className={`flex items-center justify-center rounded-full bg-neutral-900 font-bold text-white overflow-hidden border-2 border-white ${sizeMap[size]}`}
        >
          {src ? (
            <img
              src={src}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
            status === "online" ? "bg-emerald-500" : "bg-neutral-400"
          }`}
        />
      )}
    </div>
  );
}

