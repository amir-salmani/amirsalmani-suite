"use client";

import { Eye } from "lucide-react";
import { useVisitorCount } from "@/hooks/use-visitor-count";
import { cn } from "@/lib/utils";

export function VisitorCount({ className }: { className?: string }) {
  const { count, loading, error } = useVisitorCount();
  if (error) return null;

  return (
    <div role="status" className={cn("inline-flex items-center gap-2.5 rounded-full bg-muted px-4 py-2.5 text-sm text-muted-foreground", className)}>
      <Eye aria-hidden="true" className="size-4" />
      {loading ? (
        <span>Loading visitor count…</span>
      ) : (
        <span><strong className="font-semibold tabular-nums text-foreground">{count.toLocaleString()}</strong> unique {count === 1 ? "visitor" : "visitors"}</span>
      )}
    </div>
  );
}
