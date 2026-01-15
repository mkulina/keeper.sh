import type { InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { FORM_INPUT_SIZES } from "../utils/sizes";

type InputSize = "default" | "small";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  className?: string;
  size?: InputSize;
  label?: string;
  ref?: React.Ref<HTMLInputElement>;
}

const sizeStyles: Record<InputSize, string> = FORM_INPUT_SIZES;

const Input = ({ className, disabled, size = "default", label, ref, ...props }: InputProps) => (
  <div className="flex flex-col gap-0.5 font-light tracking-tight">
    {label && <label className="text-xs">{label}</label>}
    <input
      ref={ref}
      disabled={disabled}
      className={cn(
        "w-full shadow-xs border border-neutral-200 rounded-xl transition-colors bg-white",
        "focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200",
        "focus-visible:ring-neutral-300 focus-visible:ring-offset-1",
        "placeholder:text-neutral-400 tracking-normal",
        sizeStyles[size],
        disabled && "bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-75",
        className,
      )}
      {...props}
    />
  </div>
);

Input.displayName = "Input";

export { Input };
export type { InputSize, InputProps };
