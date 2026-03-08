import { forwardRef, type SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id: idProp, ...props }, ref) => {
    const id = idProp || props.name;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-prokom-black">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={[
            "w-full rounded-lg border bg-white px-3 py-2 text-prokom-black shadow-sm",
            "focus:border-prokom-accent focus:outline-none focus:ring-1 focus:ring-prokom-accent",
            error ? "border-red-500" : "border-gray-300",
          ].join(" ")}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
