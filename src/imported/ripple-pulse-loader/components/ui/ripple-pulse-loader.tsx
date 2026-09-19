"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const logoSrc = "https://cdn-new.obsidianui.dev/logo/bg-less.png?v=3";

type RipplePulseLoaderProps = {
  className?: string;
  size?: number;
};

export function RipplePulseLoader({ className, size = 150 }: RipplePulseLoaderProps) {
  return (
    <div
      className={cn("ripple-pulse-loader", className)}
      style={{ "--ripple-size": `${size}px` } as CSSProperties}
      role="status"
      aria-label="Loading"
    >
      <div className="box">
        <div className="logo">
          <img src={logoSrc} alt="" className="svg" />
        </div>
      </div>
      <div className="box" />
      <div className="box" />
      <div className="box" />
      <div className="box" />
    </div>
  );
}

export default RipplePulseLoader;
