import type { ReactNode, InputHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import { Input } from "./input";
import type { InputSize } from "./input";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  action?: ReactNode;
  inputSize?: InputSize;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, action, ...inputProps }, ref) => {
    const generatedId = useId();
    const inputId = inputProps.id || inputProps.name || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {(label || action) && (
          <div className="flex justify-between items-center">
            {label && (
              <label htmlFor={inputId} className="text-sm font-medium text-foreground">
                {label}
              </label>
            )}
            {action}
          </div>
        )}
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          {...inputProps}
        />
        {error && (
          <span id={errorId} className="text-xs text-red-600" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField };
