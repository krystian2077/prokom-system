"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  href?: string;
}

const variants = {
  primary:
    "bg-primary text-white hover:bg-red-600 shadow-soft focus:ring-primary",
  secondary:
    "bg-dark text-white hover:bg-neutral focus:ring-dark",
  outline:
    "border-2 border-primary text-primary hover:bg-red-50 focus:ring-primary",
  ghost:
    "text-dark hover:bg-gray-100 focus:ring-neutral",
};

const sizes = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-xl",
};

const base =
  "font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2";

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
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
      return (
        <Link href={href} className="inline-flex">
          <motion.span
            className={cls + " inline-flex items-center justify-center gap-2"}
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        </Link>
      );
    }
    return (
      <motion.span
        className="inline-block"
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2 }}
      >
        <button
          ref={ref}
          type={props.type ?? "button"}
          disabled={disabled}
          className={cls}
          {...props}
        >
          {children}
        </button>
      </motion.span>
    );
  }
);

PremiumButton.displayName = "PremiumButton";
