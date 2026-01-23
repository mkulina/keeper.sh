"use client";

import type { FC } from "react";
import type { VirtualItem } from "@tanstack/react-virtual";
import { CURRENT_WEEK_INDEX } from "../utils/constants";

interface WeekColumnProps {
  weekColumnRef: React.RefObject<HTMLDivElement | null>;
  virtualRows: VirtualItem[];
}

const WeekColumn: FC<WeekColumnProps> = ({ weekColumnRef, virtualRows }) => {
  return (
    <div className="hidden md:block absolute -left-8 top-0 bottom-0 w-7 overflow-hidden pointer-events-none">
      <div ref={weekColumnRef} className="absolute inset-x-0">
        {virtualRows.map((virtualRow) => {
          const weekOffset = virtualRow.index - CURRENT_WEEK_INDEX;
          const weekLabel = weekOffset === 0 ? '0' : (weekOffset > 0 ? `+${weekOffset}` : weekOffset.toString());

          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 right-0"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="absolute -top-px left-1/2 h-[calc(50%+0.0625rem)] w-px -translate-x-1/2 bg-surface-skeleton" />
              <div className="absolute top-1/2 left-1/2 h-[calc(50%+0.0625rem)] w-px -translate-x-1/2 bg-surface-skeleton" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[0.625rem] text-foreground-subtle leading-none px-1.5 py-1 bg-background rounded-xl">
                {weekLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { WeekColumn };
