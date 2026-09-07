import React from "react";
import { cn } from "@/lib/utils";

export interface AppContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "narrow" | "default" | "wide" | "full";
}

export function AppContainer({ className, size = "default", children, ...props }: AppContainerProps) {
  const sizes = {
    narrow: "max-w-xl mx-auto px-4 sm:px-6", // Mobile patient reading container (600-800px)
    default: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    wide: "max-w-full mx-auto px-4 sm:px-6 lg:px-8",
    full: "w-full px-4",
  };

  return (
    <div className={cn(sizes[size], className)} {...props}>
      {children}
    </div>
  );
}
