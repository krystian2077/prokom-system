"use client";

import { motion } from "framer-motion";

export function PremiumCard({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      className={`rounded-2xl bg-white p-6 shadow-card border border-gray-100 transition-shadow ${className}`}
      whileHover={hover ? { y: -4, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)" } : undefined}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
