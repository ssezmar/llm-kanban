import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  animated?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, size = "md", showValue = false, animated = true, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value))
    const isComplete = clampedValue >= 100

    const heights = { sm: "h-1", md: "h-2", lg: "h-3" }

    return (
      <div className={cn("relative w-full group", className)} {...props}>
        {/* Track */}
        <div
          ref={ref}
          className={cn(
            "relative w-full overflow-hidden rounded-full",
            "bg-foreground/[0.06] dark:bg-primary/[0.08]",
            heights[size]
          )}
        >
          {/* Fill */}
          <div
            className={cn(
              "h-full rounded-full relative overflow-hidden",
              animated && "transition-all duration-700 ease-out",
              isComplete
                ? "bg-foreground/80 dark:bg-primary/80"
                : "bg-foreground/25 dark:bg-primary/30"
            )}
            style={{ width: `${clampedValue}%` }}
          >
            {/* Shine sweep effect */}
            {animated && clampedValue > 0 && !isComplete && (
              <div className="absolute inset-0 animate-progress-shine">
                <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-foreground/20 dark:via-primary/25 to-transparent" />
              </div>
            )}
            {/* Completed glow */}
            {isComplete && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 dark:via-primary/15 to-transparent animate-shimmer" />
            )}
          </div>
        </div>

        {/* Optional value label */}
        {showValue && (
          <span className={cn(
            "absolute right-0 -top-5 text-[10px] font-medium tabular-nums",
            "text-muted-foreground transition-opacity",
            clampedValue > 0 ? "opacity-100" : "opacity-0"
          )}>
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
