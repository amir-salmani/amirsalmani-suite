"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Arrows from "@/lib/effects/interactive-arrows/arrows";
import ArrowsOpacity from "@/lib/effects/interactive-arrows/arrows-opacity";
import ArrowsLimit from "@/lib/effects/interactive-arrows/arrows-limit";
import ArrowsPlay from "@/lib/effects/interactive-arrows/arrows-play";
import Lines from "@/lib/effects/interactive-arrows/lines";
import Points from "@/lib/effects/interactive-arrows/points";

const engines = { arrows: Arrows, opacity: ArrowsOpacity, smooth: ArrowsLimit, playful: ArrowsPlay, lines: Lines, points: Points };
const behaviors = [
  { value: "arrows", label: "Responsive arrows" },
  { value: "opacity", label: "Opacity" },
  { value: "smooth", label: "Smooth arrows" },
  { value: "playful", label: "Playful arrows" },
  { value: "lines", label: "Lines" },
  { value: "points", label: "Points" },
];

/** @param {{ variant?: "arrows" | "opacity" | "smooth" | "playful" | "lines" | "points", showControls?: boolean, className?: string, height?: import("react").CSSProperties["height"], style?: import("react").CSSProperties }} props */
export function InteractiveArrows({ variant = "arrows", showControls = false, className, height = 400, style } = {}) {
  const [selected, setSelected] = useState(variant);
  const active = showControls ? selected : variant;
  const Engine = engines[active] || Arrows;
  const dark = active === "smooth" || active === "playful";

  return <div className={cn("relative isolate flex w-full flex-col bg-background", className)} style={{ height, containerType: "inline-size", ...style }}>
    <div data-arrow-stage="" className="relative min-h-0 flex-1 overflow-hidden rounded-xl" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <Engine />
    </div>
    {showControls && <div data-arrow-controls="" className="flex shrink-0 items-center justify-between gap-3 bg-background px-3 py-2.5 text-foreground">
      <span className="text-xs text-muted-foreground">Arrow behavior</span>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger aria-label="Arrow behavior" className="h-9 min-w-[170px] rounded-lg border-border/70 bg-background text-xs shadow-none transition-[background-color,border-color] duration-150 hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 dark:bg-background dark:hover:bg-muted/60 [&_svg]:transition-transform [&_svg]:duration-200 data-[state=open]:[&_svg]:rotate-180 motion-reduce:transition-none motion-reduce:[&_svg]:transition-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" align="end" sideOffset={6} position="popper" className="rounded-xl border-border/70 p-1 shadow-[0_8px_28px_-12px_rgb(0_0_0/0.22)] data-[state=open]:duration-250 data-[state=closed]:duration-150 data-[state=open]:zoom-in-97 data-[state=closed]:zoom-out-99 motion-reduce:animate-none">
          {behaviors.map(behavior => <SelectItem key={behavior.value} value={behavior.value} className="min-h-9 rounded-lg px-2.5 text-xs transition-colors duration-150 motion-reduce:transition-none">{behavior.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>}
  </div>;
}
