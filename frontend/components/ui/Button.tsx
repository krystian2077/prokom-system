import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  href?: string;
}

const variants = {
  primary:
    "bg-prokom-accent text-white hover:bg-red-700 focus:ring-prokom-accent",
  secondary:
    "bg-prokom-gray text-white hover:bg-gray-700 focus:ring-prokom-gray",
  outline:
    "border-2 border-prokom-accent text-prokom-accent hover:bg-red-50 focus:ring-prokom-accent",
  ghost:
    "text-prokom-black hover:bg-gray-100 focus:ring-prokom-gray",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-base rounded-lg",
  lg: "px-6 py-3 text-lg rounded-lg",
};

const base =
  "font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      children,
      className = "",
      disabled,
      href,
      ...props
    },
    ref
  ) => {
    const cls = [base, variants[variant], sizes[size], className].join(" ");
    if (href) {
      return <Link href={href} className={cls}>{children}</Link>;
    }
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cls}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
