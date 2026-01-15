import type { ReactNode, InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { Input } from "./input";
import type { InputSize } from "./input";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  action?: ReactNode;
  inputSize?: InputSize;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, action, ...inputProps }, ref) => (
    <div className="w-full flex flex-col gap-1.5">
      {(label || action) && (
        <div className="flex justify-between items-center">
          {label && (
            <label htmlFor={inputProps.name} className="text-sm font-medium text-neutral-700">
              {label}
            </label>
          )}
          {action}
        </div>
      )}
      <Input ref={ref} {...inputProps} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
);

FormField.displayName = "FormField";

export { FormField };
