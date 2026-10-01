import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none min-h-[44px] min-w-[44px]";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-dark active:bg-primary-darkest focus:ring-primary shadow-sm",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400 border border-slate-200",
      outline:
        "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-primary",
      ghost:
        "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-sm",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5 min-h-[36px]",
      md: "px-4 py-2.5 text-base gap-2 min-h-[44px]",
      lg: "px-6 py-3.5 text-lg gap-2.5 min-h-[50px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
