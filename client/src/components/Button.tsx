import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg" | "icon"
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth = false, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
    
    const variants = {
      primary: "bg-primary text-primary-foreground shadow-[0_4px_0_0_rgb(21,128,61)] hover:bg-primary/90 active:translate-y-[2px] active:shadow-[0_2px_0_0_rgb(21,128,61)]",
      secondary: "bg-secondary text-secondary-foreground shadow-[0_4px_0_0_rgb(14,116,144)] hover:bg-secondary/90 active:translate-y-[2px] active:shadow-[0_2px_0_0_rgb(14,116,144)]",
      danger: "bg-destructive text-destructive-foreground shadow-[0_4px_0_0_rgb(185,28,28)] hover:bg-destructive/90 active:translate-y-[2px] active:shadow-[0_2px_0_0_rgb(185,28,28)]",
      outline: "border-2 border-border bg-background hover:bg-muted text-foreground active:translate-y-[2px]",
      ghost: "hover:bg-muted text-foreground",
    }
    
    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-14 px-8 text-lg",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth ? "w-full" : "",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
