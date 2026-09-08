import React from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  variant?: "pill" | "underline";
}

export function Tabs<T extends string = string>({
  items,
  activeId,
  onChange,
  className = "",
  variant = "pill",
}: TabsProps<T>) {
  if (variant === "underline") {
    return (
      <div className={`flex border-b border-neutral-200 ${className}`}>
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px ${
                isActive
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300"
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1 ${className}`}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? "bg-white text-neutral-900 shadow-2xs font-bold"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50"
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

