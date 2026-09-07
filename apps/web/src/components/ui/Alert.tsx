import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
}

export function Alert({ className, variant = "info", title, children, ...props }: AlertProps) {
  const styles = {
    info: "bg-surface-container-low border-primary-light text-primary-darkest",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    danger: "bg-rose-50 border-rose-200 text-rose-900",
  };

  const icons = {
    info: <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn("p-4 rounded-xl border flex gap-3.5 text-sm leading-relaxed", styles[variant], className)}
      {...props}
    >
      {icons[variant]}
      <div className="flex flex-col gap-1">
        {title && <h4 className="font-bold text-base tracking-tight">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
}
