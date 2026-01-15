import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../utils/cn";

type InputSize = "default" | "small";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  inputSize?: InputSize;
  label?: string;
}

const sizeStyles: Record<InputSize, string> = {
  default: "py-2 px-4 text-base",
  small: "py-1.5 px-3 text-sm",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, disabled, inputSize = "default", label, ...props }, ref) => (
    <div className="flex flex-col gap-0.5 font-light tracking-tight">
      {label && <label className="text-xs">{label}</label>}
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full shadow-xs border border-neutral-200 rounded-xl transition-colors bg-white",
          "focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200",
          "placeholder:text-neutral-400 tracking-normal",
          sizeStyles[inputSize],
          disabled && "bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-75",
          className,
        )}
        {...props}
      />
    </div>
  )
);

Input.displayName = "Input";

export { Input };
export type { InputSize };
