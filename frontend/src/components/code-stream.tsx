import { useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { cn } from '@/lib/utils'
import type { CodeLang } from '@/lib/code-samples'
import { highlight } from '@/lib/highlight'
import { Loader2, Check, FileCode2 } from 'lucide-react'

// ── Streaming code editor ─────────────────────────────────────────────────

interface Props {
  code: string
  language: CodeLang
  fileName: string
  agentName?: string
  /** chars revealed per ~16ms frame */
  speed?: number
  streaming?: boolean
  /** restart after finishing (keeps the panel "alive") */
  loop?: boolean
  className?: string
  heightClass?: string
}

const langLabel: Record<CodeLang, string> = {
  typescript: 'TypeScript', tsx: 'TSX', go: 'Go', python: 'Python', sql: 'SQL',
}

export function CodeStream({
  code, language, fileName, agentName,
  speed = 2, streaming = true, loop = false,
  className, heightClass = 'h-64',
}: Props) {
  const [shown, setShown] = useState(streaming ? 0 : code.length)
  const scrollRef = useRef<HTMLDivElement>(null)
  const done = shown >= code.length

  // Typing loop
  useEffect(() => {
    if (!streaming) { setShown(code.length); return }
    setShown(0)
    let raf = 0
    let i = 0
    let pauseUntil = 0
    const step = (ts: number) => {
      if (ts >= pauseUntil) {
        // a little jitter so it feels human
        i = Math.min(code.length, i + speed + (Math.random() < 0.25 ? 1 : 0))
        setShown(i)
        if (i >= code.length) {
          if (loop) { pauseUntil = ts + 2600; i = 0 }
          else { return }
        }
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [code, streaming, speed, loop])

  // Auto-scroll to the latest line while typing
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  const visible = streaming ? code.slice(0, shown) : code
  const tokens = useMemo(() => highlight(visible, language), [visible, language])
  const lineCount = Math.max(1, visible.split('\n').length)
  const typing = streaming && !done

  return (
    <div className={cn('rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c10] shadow-xl shadow-black/30', className)}>
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-3 h-9 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        </div>
        <div className="flex items-center gap-1.5 ml-2 text-xs text-zinc-400 min-w-0">
          <FileCode2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-mono">{fileName}</span>
        </div>
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
          {langLabel[language]}
        </span>
      </div>

      {/* Code area */}
      <div ref={scrollRef} className={cn('overflow-auto font-mono text-[12.5px] leading-[1.6]', heightClass)}>
        <div className="flex min-w-full">
          {/* Gutter */}
          <div className="select-none text-right text-zinc-600 px-3 py-3 bg-zinc-900/30 sticky left-0">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Tokens */}
          <pre className="px-3 py-3 whitespace-pre text-zinc-200">
            <code>
              {tokens.map((tk, i) => (
                <Fragment key={i}>
                  {tk.c ? <span className={tk.c}>{tk.t}</span> : tk.t}
                </Fragment>
              ))}
              {typing && (
                <span className="inline-block w-[7px] h-[15px] -mb-[2px] bg-sky-400 animate-pulse align-middle" />
              )}
            </code>
          </pre>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 px-3 h-7 bg-zinc-900/80 border-t border-zinc-800 text-[11px]">
        {typing ? (
          <span className="flex items-center gap-1.5 text-sky-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            {agentName ? `${agentName} генерирует…` : 'Генерация…'}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Check className="h-3 w-3" />
            Готово
          </span>
        )}
        <span className="ml-auto text-zinc-500">
          {lineCount} стр · {Math.round((shown / code.length) * 100)}%
        </span>
      </div>
    </div>
  )
}
