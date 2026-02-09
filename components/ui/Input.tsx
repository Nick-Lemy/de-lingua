"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border rounded-xl text-sm bg-white transition-all
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            }
            focus:outline-none
            placeholder:text-gray-400
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
