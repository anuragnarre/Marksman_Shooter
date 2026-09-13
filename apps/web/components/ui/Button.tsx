import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95",
          {
            "bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary-hover)] shadow-accent hover:shadow-glow": variant === "default",
            "bg-transparent text-[var(--text-primary)] hover:bg-[var(--btn-ghost-hover-bg)]": variant === "ghost",
            "border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--btn-ghost-hover-bg)]": variant === "outline",
            "bg-[var(--signal-red)] text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,77,109,0.3)]": variant === "danger",
            "h-11 px-5 py-3": size === "default",
            "h-9 px-3": size === "sm",
            "h-14 px-8 text-lg": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
