import type { ComponentPropsWithoutRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const input = tv({
  base: "w-full rounded-xl border border-interactive-border bg-background px-4 py-2.5 text-foreground tracking-tight placeholder:text-foreground-muted disabled:opacity-50 disabled:cursor-not-allowed",
  variants: {
    tone: {
      neutral: "",
      error: "border-red-400 dark:border-red-500",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

type InputProps = ComponentPropsWithoutRef<"input"> & VariantProps<typeof input> & {
  ref?: React.Ref<HTMLInputElement>;
};

export function Input({ tone, className, ref, ...props }: InputProps) {
  return <input ref={ref} className={input({ tone, className })} {...props} />;
}
