import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-neutral-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition duration-150 focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400 disabled:opacity-50 disabled:bg-neutral-100 ${
              leftIcon ? "pl-9" : ""
            } ${rightIcon ? "pr-9" : ""} ${
              error ? "border-red-400 focus:border-red-500 focus:ring-red-400" : ""
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-neutral-400">{rightIcon}</span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition duration-150 focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400 disabled:opacity-50 disabled:bg-neutral-100 ${
            error ? "border-red-400 focus:border-red-500 focus:ring-red-400" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

