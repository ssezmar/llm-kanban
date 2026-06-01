import { Fragment } from 'react'
import type { CodeLang } from '@/lib/code-samples'
import { highlight, langFromFence } from '@/lib/highlight'
import { FileCode2 } from 'lucide-react'

const langLabel: Record<CodeLang, string> = {
  typescript: 'TypeScript', tsx: 'TSX', go: 'Go', python: 'Python', sql: 'SQL',
}

function CodeBlock({ code, language }: { code: string; language: CodeLang }) {
  const lines = code.split('\n')
  const tokens = highlight(code, language)
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c10] shadow-lg shadow-black/20 my-3">
      <div className="flex items-center gap-2 px-3 h-8 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        </div>
        <FileCode2 className="h-3.5 w-3.5 text-zinc-500 ml-1" />
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
          {langLabel[language]}
        </span>
      </div>
      <div className="overflow-auto font-mono text-[12.5px] leading-[1.6] max-h-[420px]">
        <div className="flex">
          <div className="select-none text-right text-zinc-600 px-3 py-3 bg-zinc-900/30">
            {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <pre className="px-3 py-3 whitespace-pre text-zinc-200">
            <code>
              {tokens.map((tk, i) => (
                <Fragment key={i}>{tk.c ? <span className={tk.c}>{tk.t}</span> : tk.t}</Fragment>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

const FENCE = /```(\w*)\n([\s\S]*?)```/g

// Renders text, replacing fenced ``` blocks with a styled code editor.
export function BodyWithCode({ text, className }: { text: string; className?: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  FENCE.lastIndex = 0
  while ((m = FENCE.exec(text)) !== null) {
    if (m.index > last) {
      const chunk = text.slice(last, m.index).trim()
      if (chunk) parts.push(
        <pre key={key++} className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-sans">{chunk}</pre>
      )
    }
    parts.push(<CodeBlock key={key++} code={m[2].replace(/\n$/, '')} language={langFromFence(m[1])} />)
    last = m.index + m[0].length
  }
  const tail = text.slice(last).trim()
  if (tail) parts.push(
    <pre key={key++} className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-sans">{tail}</pre>
  )

  return <div className={className}>{parts}</div>
}
