import { useToast } from "./use-toast"
import { motion, AnimatePresence } from "framer-motion"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full outline-none pointer-events-none">
      <AnimatePresence>
        {toasts.map(function ({ id, title, description, variant, ...props }) {
          const isDestructive = variant === "destructive"
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`
                pointer-events-auto flex w-full flex-col gap-1 overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-xl
                ${isDestructive 
                  ? 'bg-destructive/95 text-destructive-foreground border-destructive' 
                  : 'bg-background/80 text-foreground border-border'}
              `}
              {...props}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="grid gap-1">
                  {title && <div className="text-sm font-semibold">{title}</div>}
                  {description && (
                    <div className="text-sm opacity-90">{description}</div>
                  )}
                </div>
                <button
                  onClick={() => dismiss(id)}
                  className={`rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity ${
                    isDestructive ? 'hover:bg-destructive-foreground/20' : 'hover:bg-muted'
                  }`}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
