import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200/80 bg-white shadow-2xs transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className = "",
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between border-b border-neutral-100 px-6 py-4.5 ${className}`}
      {...props}
    >
      <div>
        {title && (
          <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-0.5 text-xs text-neutral-500 font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-6 py-3.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

