import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface Step {
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-center gap-0', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={index} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2',
                  isCompleted && 'bg-foreground border-foreground text-background',
                  isCurrent && 'border-foreground text-foreground scale-110',
                  !isCompleted && !isCurrent && 'border-border text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div className="text-center min-w-[80px]">
                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-[10px] text-muted-foreground hidden sm:block">{step.description}</p>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="flex-1 mx-3 mb-6">
                <div
                  className={cn(
                    'h-[2px] rounded-full transition-all duration-500',
                    isCompleted ? 'bg-foreground' : 'bg-border'
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
