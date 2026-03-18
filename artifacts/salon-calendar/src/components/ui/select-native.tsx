import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const SelectNative = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-12 w-full appearance-none rounded-xl border-2 border-border bg-white/50 px-4 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-primary/10 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
      </div>
    )
  }
)
SelectNative.displayName = "SelectNative"

export { SelectNative }
