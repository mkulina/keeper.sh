import type { PropsWithChildren } from "react";
import { tv } from "tailwind-variants/lite";

const text = tv({
  base: "tracking-tight",
  variants: {
    size: {
      base: "text-base",
      sm: "text-sm",
    },
    tone: {
      muted: "text-foreground-muted",
      inverse: "text-foreground-inverse",
      inverseMuted: "text-foreground-inverse-muted",
      default: "text-foreground",
      danger: "text-red-500",
    },
    align: {
      center: "text-center",
      left: "text-left",
    },
  },
  defaultVariants: {
    size: "base",
    tone: "muted",
    align: "left",
  },
});

type TextProps = PropsWithChildren<{
  size?: "base" | "sm";
  tone?: "muted" | "inverse" | "inverseMuted" | "default" | "danger";
  align?: "center" | "left";
  className?: string;
}>;

export function Text({ children, size, tone, align, className }: TextProps) {
  return <p className={text({ size, tone, align, className })}>{children}</p>;
}
