import { useState } from "react";
import { Star } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ButtonText, ExternalLinkButton } from "./button";

const SCROLL_THRESHOLD = 32;

export function GithubStarButton() {
  const [visible, setVisible] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest <= SCROLL_THRESHOLD);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 10, filter: "blur(4px)" }}
          transition={{ duration: 0.2 }}
        >
          <ExternalLinkButton size="compact" variant="ghost" href="https://github.com" target="_blank" rel="noreferrer">
            <Star size={14} />
            <ButtonText>403</ButtonText>
          </ExternalLinkButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
