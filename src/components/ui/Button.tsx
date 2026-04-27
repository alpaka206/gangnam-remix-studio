import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-amber-400/70 bg-amber-300 text-zinc-950 hover:bg-amber-200",
  secondary:
    "border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-700",
  ghost:
    "border-transparent bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50",
  danger:
    "border-rose-500/60 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
};

export function Button({
  className,
  children,
  icon,
  variant = "secondary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
