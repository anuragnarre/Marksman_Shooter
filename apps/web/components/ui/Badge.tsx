import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  let variantStyles = ""
  switch (variant) {
    case "default":
      variantStyles = "bg-accent/15 text-accent border-transparent"
      break
    case "secondary":
      variantStyles = "bg-bg-elevated text-text-secondary border-transparent"
      break
    case "destructive":
      variantStyles = "bg-signal-red/15 text-signal-red border-transparent"
      break
    case "outline":
      variantStyles = "text-text-primary border-border-default"
      break
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles} ${className || ""}`}
      {...props}
    />
  )
}
