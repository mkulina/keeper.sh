import type { PropsWithChildren } from "react";
import { motion, type HTMLMotionProps, type TargetAndTransition } from "motion/react";

type Direction = "from-right" | "from-top";

const variants: Record<Direction, { hidden: TargetAndTransition; visible: TargetAndTransition }> = {
  "from-right": {
    hidden: { opacity: 0, x: 10, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  "from-top": {
    hidden: { opacity: 0, y: -10, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
};

const TRANSITION = { duration: 0.2 } as const;

interface FadeInProps extends HTMLMotionProps<"div"> {
  direction: Direction;
}

export function FadeIn({ direction, children, ...props }: PropsWithChildren<FadeInProps>) {
  const { hidden, visible } = variants[direction];

  return (
    <motion.div
      initial={hidden}
      animate={visible}
      exit={hidden}
      transition={TRANSITION}
      {...props}
    >
      {children}
    </motion.div>
  );
}
