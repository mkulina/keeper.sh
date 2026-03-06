import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

const HIDDEN = { height: 0, opacity: 0, filter: "blur(4px)" };
const VISIBLE = { height: "fit-content", opacity: 1, filter: "blur(0)" };
const CLIP_STYLE = { overflow: "clip" as const, overflowClipMargin: 4 };

interface AnimatedRevealProps {
  show: boolean;
  skipInitial?: boolean;
  children: ReactNode;
}

export function AnimatedReveal({ show, skipInitial, children }: AnimatedRevealProps) {
  return (
    <AnimatePresence initial={!skipInitial}>
      {show && (
        <motion.div
          style={CLIP_STYLE}
          initial={HIDDEN}
          animate={VISIBLE}
          exit={HIDDEN}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
