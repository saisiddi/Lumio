"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlowingButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "blue" | "violet";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function GlowingButton({ 
  children, 
  onClick, 
  className, 
  variant = "blue",
  type = "button",
  disabled = false
}: GlowingButtonProps) {
  
  const isBlue = variant === "blue";
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      suppressHydrationWarning
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(
        "relative group inline-flex items-center justify-center",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn(
        "absolute -inset-0.5 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-500",
        isBlue ? "bg-gradient-to-r from-[#3B82F6] to-blue-700" : "bg-gradient-to-r from-[#8B5CF6] to-purple-700"
      )}></div>
      <div className={cn(
        "relative px-8 py-4 bg-brand-slate rounded-lg flex items-center justify-center w-full border",
        isBlue ? "border-[#3B82F6]/30" : "border-[#8B5CF6]/30"
      )}>
        <span className={cn(
          "font-semibold text-white tracking-wide transition duration-200",
          isBlue ? "group-hover:text-glow-electric" : "group-hover:text-glow-violet"
        )}>
          {children}
        </span>
      </div>
    </motion.button>
  );
}
