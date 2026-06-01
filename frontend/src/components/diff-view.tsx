import { useMemo, useState, Fragment } from 'react'
import type { GitHubPullFile } from '@/lib/github-types'
import { highlight, langFromFilename } from '@/lib/highlight'
import { cn } from '@/lib/utils'
import { FileCode2, FilePlus2, FileMinus2, FilePen } from 'lucide-react'

interface DiffLine {
  type: 'add' | 'del' | 'ctx' | 'hunk'
  oldNo: number | null
  newNo: number | null
  text: string
}

function parsePatch(patch: string): DiffLine[] {
  const out: DiffLine[] = []
  let oldNo = 0, newNo = 0
  for (const line of patch.split('\n')) {
    if (line.startsWith('@@')) {
      const m = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
      if (m) { oldNo = +m[1]; newNo = +m[2] }
      out.push({ type: 'hunk', oldNo: null, newNo: null, text: line })
    } else if (line.startsWith('+')) {
      out.push({ type: 'add', oldNo: null, newNo: newNo++, text: line.slice(1) })
    } else if (line.startsWith('-')) {
      out.push({ type: 'del', oldNo: oldNo++, newNo: null, text: line.slice(1) })
    } else {
      const text = line.startsWith(' ') ? line.slice(1) : line
      out.push({ type: 'ctx', oldNo: oldNo++, newNo: newNo++, text })
    }
  }
  return out
}

const statusMeta: Record<GitHubPullFile['status'], { icon: typeof FileCode2; color: string; glyph: string }> = {
  added: { icon: FilePlus2, color: 'text-emerald-400', glyph: 'A' },
  modified: { icon: FilePen, color: 'text-amber-400', glyph: 'M' },
  removed: { icon: FileMinus2, color: 'text-red-400', glyph: 'D' },
  renamed: { icon: FileCode2, color: 'text-sky-400', glyph: 'R' },
}

function splitPath(p: string) {
  const i = p.lastIndexOf('/')
  return { dir: i >= 0 ? p.slice(0, i + 1) : '', name: i >= 0 ? p.slice(i + 1) : p }
}

function DiffBody({ file }: { file: GitHubPullFile }) {
  const lang = langFromFilename(file.filename)
  const lines = useMemo(() => parsePatch(file.patch), [file.patch])

  return (
    <div className="overflow-auto font-mono text-[12.5px] leading-[1.6] max-h-[520px]">
      {lines.map((ln, i) => {
        if (ln.type === 'hunk') {
          return (
            <div key={i} className="px-3 py-0.5 bg-sky-500/10 text-sky-300/80 select-none">
              {ln.text}
            </div>
          )
        }
        const bg = ln.type === 'add' ? 'bg-emerald-500/10' : ln.type === 'del' ? 'bg-red-500/10' : ''
        const sign = ln.type === 'add' ? '+' : ln.type === 'del' ? '-' : ' '
        const signColor = ln.type === 'add' ? 'text-emerald-400' : ln.type === 'del' ? 'text-red-400' : 'text-zinc-600'
        const tokens = highlight(ln.text, lang)
        return (
          <div key={i} className={cn('flex hover:bg-white/[0.03]', bg)}>
            <span className="select-none w-10 shrink-0 text-right pr-2 text-zinc-600">{ln.oldNo ?? ''}</span>
            <span className="select-none w-10 shrink-0 text-right pr-2 text-zinc-600">{ln.newNo ?? ''}</span>
            <span className={cn('select-none w-4 shrink-0 text-center', signColor)}>{sign}</span>
            <pre className="whitespace-pre flex-1 pr-3 text-zinc-200">
              <code>
                {tokens.map((tk, j) => (
                  <Fragment key={j}>{tk.c ? <span className={tk.c}>{tk.t}</span> : tk.t}</Fragment>
                ))}
              </code>
            </pre>
          </div>
        )
      })}
    </div>
  )
}

export function DiffView({ files }: { files: GitHubPullFile[] }) {
  const [active, setActive] = useState(0)
  if (!files.length) return null
  const file = files[Math.min(active, files.length - 1)]
  const totalAdd = files.reduce((s, f) => s + f.additions, 0)
  const totalDel = files.reduce((s, f) => s + f.deletions, 0)
  const meta = statusMeta[file.status]
  const { dir, name } = splitPath(file.filename)

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c10] shadow-xl shadow-black/30 flex flex-col lg:flex-row">
      {/* Explorer */}
      <div className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-900/40">
        <div className="px-3 h-9 flex items-center justify-between border-b border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Изменено файлов · {files.length}
          </span>
          <span className="text-[11px] font-mono">
            <span className="text-emerald-400">+{totalAdd}</span>{' '}
            <span className="text-red-400">−{totalDel}</span>
          </span>
        </div>
        <div className="max-h-44 lg:max-h-[520px] overflow-auto py-1">
          {files.map((f, i) => {
            const fm = statusMeta[f.status]
            const sp = splitPath(f.filename)
            const Icon = fm.icon
            return (
              <button
                key={f.filename}
                onClick={() => setActive(i)}
                className={cn(
                  'w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs transition-colors',
                  i === active ? 'bg-white/[0.07] text-zinc-100' : 'text-zinc-400 hover:bg-white/[0.04]'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', fm.color)} />
                <span className="truncate flex-1 font-mono">
                  {sp.dir && <span className="text-zinc-600">{sp.dir}</span>}
                  {sp.name}
                </span>
                <span className="font-mono text-[10px] shrink-0">
                  <span className="text-emerald-400">+{f.additions}</span>{' '}
                  <span className="text-red-400">−{f.deletions}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="px-3 h-9 flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60">
          <span className={cn('text-[10px] font-bold w-4 text-center rounded bg-zinc-800', meta.color)}>{meta.glyph}</span>
          <span className="text-xs font-mono truncate min-w-0">
            {dir && <span className="text-zinc-500">{dir}</span>}
            <span className="text-zinc-200">{name}</span>
          </span>
          <span className="ml-auto text-[11px] font-mono shrink-0">
            <span className="text-emerald-400">+{file.additions}</span>{' '}
            <span className="text-red-400">−{file.deletions}</span>
          </span>
        </div>
        <DiffBody file={file} />
      </div>
    </div>
  )
}
