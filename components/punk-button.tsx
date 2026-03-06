"use client";

import { Button as AriaButton } from "react-aria-components";
import type { ButtonProps as AriaButtonProps } from "react-aria-components";

type Variant = "primary" | "outline" | "ghost" | "danger";

interface PunkButtonProps extends AriaButtonProps {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  skew?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-punk-pink text-white border-2 border-punk-pink hover:bg-punk-pink/80 shadow-[4px_4px_0px_0px_rgba(255,45,123,0.3)]",
  outline:
    "bg-transparent text-foreground border-2 border-foreground hover:bg-foreground hover:text-background",
  ghost:
    "bg-transparent text-muted-foreground border-2 border-transparent hover:text-foreground hover:border-border",
  danger:
    "bg-punk-red text-white border-2 border-punk-red hover:bg-punk-red/80",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-4 text-base",
};

export function PunkButton({
  variant = "primary",
  size = "md",
  skew = false,
  className = "",
  children,
  ...props
}: PunkButtonProps) {
  return (
    <AriaButton
      className={`
        inline-flex items-center justify-center gap-2
        font-bold uppercase tracking-wider
        transition-all duration-150
        active:translate-y-0.5 active:shadow-none
        disabled:opacity-40 disabled:pointer-events-none
        cursor-pointer
        ${skew ? "-skew-x-3" : ""}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </AriaButton>
  );
}
