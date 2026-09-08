import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const SKIP_DIRS = new Set([
  '.obsidian',
  '.claude',
  '.remember',
  '.git',
  '.vitepress',
  'node_modules',
  '_assets'
])

export type NoteIndex = {
  /** basename without .md → site url */
  byName: Map<string, string>
  /** vault-relative posix path without .md → site url */
  byPath: Map<string, string>
}

export function collectNotes(dir = ROOT, rel = ''): NoteIndex {
  const byName = new Map<string, string>()
  const byPath = new Map<string, string>()
  walk(dir, rel, byName, byPath)
  return { byName, byPath }
}

function walk(
  dir: string,
  rel: string,
  byName: Map<string, string>,
  byPath: Map<string, string>
) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && SKIP_DIRS.has(entry.name)) continue
    if (SKIP_DIRS.has(entry.name)) continue
    const abs = path.join(dir, entry.name)
    const childRel = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      walk(abs, childRel, byName, byPath)
      continue
    }
    if (!entry.name.endsWith('.md')) continue
    if (childRel === 'README.md' || childRel === 'index.md') continue
    const url = mdPathToUrl(childRel)
    const stem = entry.name.replace(/\.md$/i, '')
    byName.set(stem, url)
    byPath.set(childRel.replace(/\.md$/i, ''), url)
  }
}

export function mdPathToUrl(mdPath: string): string {
  let p = mdPath.replaceAll('\\', '/')
  if (/\/README\.md$/i.test(p) || /^README\.md$/i.test(p)) {
    p = p.replace(/README\.md$/i, '')
  } else if (/\/index\.md$/i.test(p) || /^index\.md$/i.test(p)) {
    p = p.replace(/index\.md$/i, '')
  } else {
    p = p.replace(/\.md$/i, '')
  }
  if (!p.startsWith('/')) p = `/${p}`
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

function resolveWikiTarget(raw: string, notes: NoteIndex): string | null {
  const [page, hash] = raw.split('#')
  const key = page.trim()
  if (!key) return null
  const url =
    notes.byPath.get(key) ??
    notes.byName.get(key) ??
    notes.byPath.get(key.replace(/\.md$/i, ''))
  if (!url) return null
  return hash ? `${url}#${slugify(hash)}` : url
}

function slugify(heading: string): string {
  return heading
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function mapOutsideCode(src: string, fn: (chunk: string) => string): string {
  return src
    .split(/(```[\s\S]*?```|`[^`]+`)/)
    .map((chunk, i) => (i % 2 === 1 ? chunk : fn(chunk)))
    .join('')
}

function rewriteWikiImages(src: string, relativePath: string): string {
  return mapOutsideCode(src, (chunk) =>
    chunk.replace(/!\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
      const [target, alias] = splitAlias(inner)
      const alt = (alias ?? path.posix.basename(target)).replace(/\.[^.]+$/, '')
      const href = toAssetHref(target.trim(), relativePath)
      return `![${alt}](${href})`
    })
  )
}

function splitAlias(inner: string): [string, string | undefined] {
  const idx = inner.indexOf('|')
  if (idx === -1) return [inner, undefined]
  return [inner.slice(0, idx), inner.slice(idx + 1)]
}

function toAssetHref(target: string, relativePath: string): string {
  const vaultPath = target.replaceAll('\\', '/')
  const fromDir = path.posix.dirname(relativePath.replaceAll('\\', '/'))
  const rel = path.posix.relative(fromDir === '.' ? '' : fromDir, vaultPath)
  const href = rel.startsWith('.') ? rel : `./${rel}`
  return encodeURI(href)
}

function rewriteWikiLinks(src: string, notes: NoteIndex): string {
  return mapOutsideCode(src, (chunk) =>
    chunk.replace(/\[\[([^\]]+)\]\]/g, (_full, inner: string) => {
      const [target, alias] = splitAlias(inner)
      const url = resolveWikiTarget(target, notes)
      const text = (alias ?? target.split('#')[0]).trim()
      if (!url) return text
      return `[${text}](<${url}>)`
    })
  )
}

export function obsidianMarkdown(notes: NoteIndex) {
  return (md: { core: { ruler: { before: (name: string, key: string, fn: (state: { src: string; env?: Record<string, unknown> }) => void) => void } } }) => {
    md.core.ruler.before('normalize', 'obsidian-wiki', (state) => {
      const relativePath = String(state.env?.relativePath ?? '')
      let src = state.src
      src = rewriteWikiImages(src, relativePath)
      src = rewriteWikiLinks(src, notes)
      state.src = src
    })
  }
}
