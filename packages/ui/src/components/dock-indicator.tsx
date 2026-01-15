"use client";

import { motion } from "motion/react";
import { useSelectedLayoutSegment } from "next/navigation";
import type { FC } from "react";

interface DockIndicatorProps {
  segment: string | null;
}

const DockIndicator: FC<DockIndicatorProps> = ({ segment }) => {
  const selectedSegment = useSelectedLayoutSegment();

  if (selectedSegment !== segment) {
    return null;
  }

  return (
    <motion.div
      layout
      layoutId="indicator"
      style={{ originY: "top" }}
      transition={{ duration: 0.16, ease: [0.5, 0, 0, 1] }}
      className="absolute inset-0 size-full rounded-full z-10 bg-surface-muted border border-border"
    />
  );
};

DockIndicator.displayName = "DockIndicator";

export { DockIndicator };
