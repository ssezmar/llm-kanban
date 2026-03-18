import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { DynamicIcon, ICON_GROUPS } from './dynamic-icon'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  className?: string
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'h-12 w-12 rounded-xl border-2 border-dashed border-border',
          'flex items-center justify-center',
          'hover:border-foreground/30 hover:bg-muted/50 transition-all',
          value && 'border-solid border-border'
        )}
      >
        <DynamicIcon name={value || 'code'} className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute top-14 left-0 z-50 bg-card border rounded-xl shadow-lg p-3 w-[300px] max-h-[360px] overflow-y-auto animate-scale-in">
          {ICON_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="text-[10px] text-muted-foreground font-medium mb-1.5 px-1">{group.label}</p>
              <div className="flex flex-wrap gap-0.5">
                {group.icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => { onChange(icon); setOpen(false) }}
                    className={cn(
                      'h-8 w-8 rounded-md flex items-center justify-center',
                      'hover:bg-muted transition-colors',
                      value === icon && 'bg-muted ring-1 ring-foreground/20'
                    )}
                    title={icon}
                  >
                    <DynamicIcon name={icon} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
