import type { PropsWithChildren } from "react";
import { cn } from "../../../utils/cn";
import { Text } from "../../../components/ui/primitives/text";

export function MarketingHowItWorksSection({ children }: PropsWithChildren) {
  return <section className="w-full pt-16 pb-4">{children}</section>;
}

const ILLUSTRATION_STYLE = {
  backgroundImage:
    "repeating-linear-gradient(-45deg, transparent 0 14px, var(--color-illustration-stripe) 14px 15px)",
} as const;

export function MarketingHowItWorksCard({ children }: PropsWithChildren) {
  return (
    <ol className="mt-8 grid grid-cols-1 gap-px rounded-2xl overflow-hidden border border-interactive-border bg-interactive-border list-none">
      {children}
    </ol>
  );
}

export function MarketingHowItWorksRow({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <li className={cn("flex flex-col sm:flex-row", className)}>
      {children}
    </li>
  );
}

export function MarketingHowItWorksStepBody({
  step,
  children,
}: PropsWithChildren<{ step: number }>) {
  return (
    <div className="bg-background flex flex-col justify-center gap-1 p-6 sm:p-8 sm:flex-1">
      <Text size="sm" tone="muted">{step}</Text>
      {children}
    </div>
  );
}

export function MarketingHowItWorksStepIllustration() {
  return (
    <div
      className="bg-background flex items-center justify-center min-h-48 sm:flex-1"
      style={ILLUSTRATION_STYLE}
      role="presentation"
    />
  );
}
