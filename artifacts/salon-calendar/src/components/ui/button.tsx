import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glass"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const variants = {
      default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md",
      outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      glass: "bg-white/40 backdrop-blur-md border border-white/50 text-foreground hover:bg-white/60 shadow-sm",
    }

    const sizes = {
      default: "h-11 px-6 py-2 rounded-xl",
      sm: "h-9 rounded-lg px-4",
      lg: "h-14 rounded-2xl px-8 text-lg",
      icon: "h-11 w-11 rounded-xl",
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          variants[variant],
          sizes[size],
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
