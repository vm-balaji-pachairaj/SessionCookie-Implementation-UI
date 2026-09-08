import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "theme";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-lg outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none focus:ring-2 focus:ring-offset-1";

    const variantStyles = {
      primary:
        "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 focus:ring-neutral-400 shadow-2xs",
      secondary:
        "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-300 border border-neutral-200/60",
      outline:
        "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100 focus:ring-neutral-300 shadow-2xs",
      ghost:
        "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 focus:ring-neutral-200",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-300 shadow-2xs",
      theme:
        "bg-[#C81E1E] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] focus:ring-red-200 shadow-2xs",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-xs px-4 py-2 gap-2",
      lg: "text-sm px-5 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

