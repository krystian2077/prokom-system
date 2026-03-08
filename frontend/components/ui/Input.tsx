import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id: idProp, ...props }, ref) => {
    const id = idProp || props.name || props.placeholder;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-prokom-black">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={[
            "w-full rounded-lg border bg-white px-3 py-2 text-prokom-black shadow-sm",
            "focus:border-prokom-accent focus:outline-none focus:ring-1 focus:ring-prokom-accent",
            error ? "border-red-500" : "border-gray-300",
          ].join(" ")}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
