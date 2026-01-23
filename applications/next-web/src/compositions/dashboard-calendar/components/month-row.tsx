"use client";

import type { FC } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MONTH_NAMES } from "../utils/constants";
import type { MonthSpan } from "../utils/date-utils";

interface MonthRowProps {
  monthSpans: MonthSpan[];
  monthCompositionKey: string;
  scrollDirection: 'up' | 'down';
}

const MonthRow: FC<MonthRowProps> = ({ monthSpans, monthCompositionKey, scrollDirection }) => {
  const getYOffset = () => {
    if (scrollDirection === "down") {
      return 16;
    }
    return -16;
  };
  const yOffset = getYOffset();

  return (
    <div className="relative h-4 overflow-hidden">
      <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-surface-skeleton" />
      <AnimatePresence mode="popLayout" initial={false}>
        {monthSpans.map((span) => {
          const centerCol = (span.startCol + span.endCol) / 2;
          const leftPercent = ((centerCol + 0.5) / 7) * 100;
          const label = `${MONTH_NAMES[span.month]!.toUpperCase()}${span.year.toString().slice(-2)}`;

          return (
            <motion.span
              key={`${span.month}-${span.year}-${monthCompositionKey}`}
              initial={{ y: yOffset, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -yOffset, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${leftPercent}%` }}
            >
              <span className="block font-mono text-[0.625rem] text-foreground-subtle leading-none px-1.5 py-1 bg-background rounded-xl whitespace-nowrap">
                {label}
              </span>
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export { MonthRow };
