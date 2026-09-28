import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "ghost"
  | "ghost-danger"
  | "inverse"
  | "destructive"
  | "warning";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-semibold select-none " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-strong";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-fg-strong hover:bg-accent-hover active:bg-accent-pressed",
  secondary: "border border-divider text-fg hover:border-fg-strong hover:bg-surface active:bg-divider",
  neutral: "border border-line bg-surface text-fg-strong hover:bg-surface-raised hover:border-line-strong active:bg-line",
  ghost: "text-muted hover:bg-surface hover:text-fg active:bg-line",
  "ghost-danger": "text-danger hover:bg-danger/10 active:bg-danger/20",
  inverse: "bg-white text-black hover:bg-[#e7e5e4] active:bg-[#d6d3d1]",
  destructive: "bg-danger text-fg hover:bg-danger-hover active:bg-danger-pressed",
  warning: "border border-line bg-surface text-warning hover:bg-surface-raised hover:border-warning/60 active:bg-line",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
  xl: "h-[50px] px-6 text-[15px] font-bold",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant,
  size,
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...props}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
