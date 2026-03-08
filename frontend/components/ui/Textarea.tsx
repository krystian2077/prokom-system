import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id: idProp, ...props }, ref) => {
    const id = idProp || props.name;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-prokom-black">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={4}
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

Textarea.displayName = "Textarea";
