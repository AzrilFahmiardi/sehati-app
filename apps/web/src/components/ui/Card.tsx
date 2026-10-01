import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat" | "interactive";
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const base = "rounded-xl bg-white border border-slate-200 transition-all";
  const variants = {
    default: "shadow-sm hover:shadow-md",
    flat: "shadow-none border-slate-200",
    interactive: "shadow-sm hover:shadow-lg hover:border-primary-accent cursor-pointer active:scale-[0.99]",
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 border-b border-slate-100 flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-bold text-slate-900 tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-500 mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between gap-3", className)} {...props}>
      {children}
    </div>
  );
}
