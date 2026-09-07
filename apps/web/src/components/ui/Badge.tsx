import React from "react";
import { cn, getRiskBadgeStyle, getRiskLabel } from "@/lib/utils";
import { AnemiaRisk } from "@/types/result";
import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const base = "inline-flex items-center gap-1 font-semibold rounded-full border px-2.5 py-0.5 text-xs transition-colors";
  
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    secondary: "bg-surface-container-low text-primary-dark border-primary-light",
    outline: "bg-transparent text-slate-700 border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}

export function PatientRiskBadge({ risk, className }: { risk: AnemiaRisk; className?: string }) {
  const label = getRiskLabel(risk);
  const style = getRiskBadgeStyle(risk);

  const getIcon = () => {
    switch (risk) {
      case "low":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />;
      case "moderate":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />;
      case "high":
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm",
        style,
        className
      )}
      aria-label={`Tingkat Risiko: ${label}`}
    >
      {getIcon()}
      <span>{label}</span>
    </span>
  );
}
