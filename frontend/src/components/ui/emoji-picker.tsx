import { useState } from 'react'
import { cn } from '@/lib/utils'

const EMOJI_GROUPS = {
  'Статусы': ['📋', '🔨', '👀', '✅', '⏸️', '🔄', '⚠️', '❌', '🏁', '📌'],
  'Работа': ['💻', '🧪', '🐛', '🔧', '📝', '📊', '🎨', '🔍', '📦', '🛠️'],
  'Проекты': ['🚀', '⚡', '🔐', '🌐', '📱', '🗄️', '🔔', '💡', '🎯', '📈'],
  'Прочее': ['🏷️', '💬', '🧩', '🎭', '🌟', '🔥', '💎', '🏆', '🧠', '🎪'],
}

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  className?: string
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'h-12 w-12 rounded-xl border-2 border-dashed border-border',
          'flex items-center justify-center text-2xl',
          'hover:border-foreground/30 hover:bg-muted/50 transition-all',
          value && 'border-solid border-border'
        )}
      >
        {value || '➕'}
      </button>
      {open && (
        <div className="absolute top-14 left-0 z-50 bg-card border rounded-xl shadow-lg p-3 w-[280px] animate-scale-in">
          {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
            <div key={group} className="mb-2">
              <p className="text-[10px] text-muted-foreground font-medium mb-1 px-1">{group}</p>
              <div className="flex flex-wrap gap-0.5">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { onChange(emoji); setOpen(false) }}
                    className={cn(
                      'h-8 w-8 rounded-md flex items-center justify-center text-lg',
                      'hover:bg-muted transition-colors',
                      value === emoji && 'bg-muted ring-1 ring-foreground/20'
                    )}
                  >
                    {emoji}
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
