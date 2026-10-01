import React from "react";
import { Skeleton } from "./Skeleton";

export function TableSkeleton({ rows = 4, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-6 px-4 py-3.5 border-b border-slate-100 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
