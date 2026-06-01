// Shared lightweight syntax highlighter (regex tokenizer) used by the
// streaming code editor, the diff viewer and inline code blocks.

import type { CodeLang } from './code-samples'

const KEYWORDS: Record<CodeLang, string[]> = {
  typescript: ['import','export','from','const','let','var','function','return','if','else','for','while','async','await','interface','type','class','extends','implements','new','public','private','readonly','void','null','undefined','true','false','this','enum','as','of','in','try','catch','finally','throw','default','switch','case','break','continue','typeof','keyof'],
  tsx: ['import','export','from','const','let','var','function','return','if','else','for','while','async','await','interface','type','class','extends','new','void','null','undefined','true','false','this','as','of','in','try','catch','throw','default'],
  go: ['package','import','func','return','if','else','for','range','var','const','type','struct','interface','map','chan','go','defer','select','switch','case','default','break','continue','nil','true','false','make','new','append','len','string','int','int64','uint64','bool','byte','error'],
  python: ['def','return','if','elif','else','for','while','import','from','as','class','with','try','except','finally','raise','async','await','lambda','None','True','False','self','in','not','and','or','is','pass','yield','global','dict','list','str','int'],
  sql: ['SELECT','FROM','WHERE','JOIN','LEFT','INNER','OUTER','ON','GROUP','BY','ORDER','LIMIT','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','INDEX','ALTER','DROP','AND','OR','AS','NOT','NULL','PRIMARY','KEY','FOREIGN','REFERENCES','DEFAULT','UNIQUE','BOOLEAN','UUID','TIMESTAMPTZ','now'],
}

const TOKEN_RE = /(\/\/[^\n]*|#[^\n]*|--[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d[\d_.]*\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)|([^\sA-Za-z0-9_$])/g

// Token color classes (tuned for a dark editor surface)
export const HL = {
  comment: 'text-zinc-500 italic',
  string: 'text-emerald-400',
  number: 'text-amber-400',
  keyword: 'text-violet-400',
  func: 'text-sky-400',
  type: 'text-cyan-400',
  punct: 'text-zinc-500',
  plain: 'text-zinc-200',
}

export interface HlToken { t: string; c: string }

export function highlight(code: string, lang: CodeLang): HlToken[] {
  const kw = new Set(KEYWORDS[lang] || [])
  const out: HlToken[] = []
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(code)) !== null) {
    const [full, comment, str, num, ident, ws, punct] = m
    if (comment) out.push({ t: full, c: HL.comment })
    else if (str) out.push({ t: full, c: HL.string })
    else if (num) out.push({ t: full, c: HL.number })
    else if (ident) {
      const after = code[TOKEN_RE.lastIndex]
      if (kw.has(ident)) out.push({ t: ident, c: HL.keyword })
      else if (after === '(') out.push({ t: ident, c: HL.func })
      else if (/^[A-Z]/.test(ident)) out.push({ t: ident, c: HL.type })
      else out.push({ t: ident, c: HL.plain })
    } else if (ws) out.push({ t: ws, c: '' })
    else if (punct) out.push({ t: punct, c: HL.punct })
  }
  return out
}

const EXT_LANG: Record<string, CodeLang> = {
  ts: 'typescript', mts: 'typescript', cts: 'typescript',
  tsx: 'tsx', jsx: 'tsx', js: 'typescript', mjs: 'typescript',
  go: 'go', py: 'python', sql: 'sql',
}

export function langFromFilename(name: string): CodeLang {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return EXT_LANG[ext] || 'typescript'
}

export function langFromFence(tag: string): CodeLang {
  const t = tag.trim().toLowerCase()
  if (t === 'ts' || t === 'typescript') return 'typescript'
  if (t === 'tsx' || t === 'jsx') return 'tsx'
  if (t === 'go' || t === 'golang') return 'go'
  if (t === 'py' || t === 'python') return 'python'
  if (t === 'sql') return 'sql'
  return 'typescript'
}
