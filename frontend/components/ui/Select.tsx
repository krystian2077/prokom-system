import { forwardRef, useEffect, useMemo, useRef, useState, type ChangeEvent, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

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
  solidMenu?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    options,
    placeholder,
    className = "",
    solidMenu = false,
    id: idProp,
    value,
    defaultValue,
    disabled,
    onChange,
    name,
    ...props
  }, ref) => {
    const id = idProp || name;
    const rootRef = useRef<HTMLDivElement | null>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);
    const isControlled = value !== undefined;
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(() => {
      if (value !== undefined && value !== null) return String(value);
      if (defaultValue !== undefined && defaultValue !== null) return String(defaultValue);
      return "";
    });

    const currentValue = isControlled ? String(value ?? "") : internalValue;
    const menuOptions = useMemo(
      () => (placeholder ? [{ value: "", label: placeholder }, ...options] : options),
      [options, placeholder],
    );
    const currentLabel = useMemo(() => {
      const found = menuOptions.find((o) => o.value === currentValue);
      return found?.label ?? placeholder ?? "Wybierz";
    }, [currentValue, menuOptions, placeholder]);

    useEffect(() => {
      const onDown = (e: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("keydown", onKey);
      };
    }, []);

    const emitChange = (nextValue: string) => {
      const target = (hiddenSelectRef.current ?? { value: nextValue, name }) as HTMLSelectElement;
      if (!isControlled) setInternalValue(nextValue);
      target.value = nextValue;
      onChange?.({ target, currentTarget: target } as ChangeEvent<HTMLSelectElement>);
    };

    return (
      <div ref={rootRef} className={`relative ${className}`}>
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
            {label}
          </label>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpen((v) => !v);
          }}
          className={[
            "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02))] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,.18)]",
            "transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_36px_rgba(0,0,0,.28)]",
            "focus:outline-none focus:ring-4 focus:ring-[rgba(59,130,246,.18)]",
            error ? "border-red-500" : "",
            disabled ? "cursor-not-allowed opacity-60 hover:translate-y-0" : "",
          ].join(" ")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
        >
          <span className={currentValue ? "truncate" : "truncate text-[var(--ink2)]"}>{currentLabel}</span>
          <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        <select
          ref={(node) => {
            hiddenSelectRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          name={name}
          value={currentValue}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {open ? (
          <div
            className={[
              "absolute left-0 top-full z-[220] mt-2 w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,.45)] pointer-events-auto",
              solidMenu ? "bg-[#0b1220]" : "bg-[#0f1117] backdrop-blur-xl",
            ].join(" ")}
          >
            <div className="max-h-[280px] overflow-auto p-2">
              {menuOptions.length === 0 ? (
                <div className="px-3 py-3 text-sm text-[#8b93a8]">Brak opcji</div>
              ) : (
                menuOptions.map((opt) => {
                  const active = opt.value === currentValue;
                  return (
                    <button
                      key={`${opt.value || "empty"}-${opt.label}`}
                      type="button"
                      onClick={() => {
                        emitChange(opt.value);
                        setOpen(false);
                      }}
                      className={[
                        "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition cursor-pointer select-none",
                        active
                          ? solidMenu
                            ? "bg-[#1a2a48] text-white shadow-[0_0_0_1px_rgba(96,165,250,.35)]"
                            : "bg-[rgba(59,130,246,.16)] text-white shadow-[0_0_0_1px_rgba(59,130,246,.18)]"
                          : solidMenu
                            ? "bg-[#0f1626] text-[#cbd5e1] hover:bg-[#162036] hover:text-white"
                            : "text-[#cbd5e1] hover:bg-white/[.05] hover:text-white",
                      ].join(" ")}
                    >
                      <span className="truncate">{opt.label}</span>
                      {active ? <span className="ml-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#93c5fd]">Wybrane</span> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {error && <p className="mt-1 text-sm font-medium text-[#fca5a5]">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
