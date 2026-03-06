import { useState } from "react";
import { Star } from "lucide-react";
import { AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import { ButtonText, ExternalLinkButton } from "./button";
import { FadeIn } from "./fade-in";

const SCROLL_THRESHOLD = 32;

export function GithubStarButton() {
  const [visible, setVisible] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest <= SCROLL_THRESHOLD);
  });

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <FadeIn direction="from-right">
          <ExternalLinkButton size="compact" variant="ghost" href="https://github.com" target="_blank" rel="noreferrer">
            <Star size={14} />
            <ButtonText>403</ButtonText>
          </ExternalLinkButton>
        </FadeIn>
      )}
    </AnimatePresence>
  );
}
