import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mdPathToUrl } from './obsidian'

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

const SKIP_FILES = new Set(['README.md', 'index.md'])

const SECTION_LABELS: Record<string, string> = {
  '00-Overview': '总览',
  '01-Articles': '文章',
  '02-Thoughts': '思考',
  '03-HarnessEngineering': 'Harness Engineering',
  '04-GameDesignWorkshop': 'Game Design Workshop',
  '05-ClaudeCookbooks': 'Claude Cookbooks'
}

type SidebarItem = {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

type RankedItem = SidebarItem & { created: string }

export function buildSidebar(): SidebarItem[] {
  const sections = [
    '00-Overview',
    '01-Articles',
    '02-Thoughts',
    '03-HarnessEngineering',
    '04-GameDesignWorkshop',
    '05-ClaudeCookbooks'
  ]
  return sections
    .map((name) => {
      const abs = path.join(ROOT, name)
      if (!fs.existsSync(abs)) return null
      const items = (name === '01-Articles' ? walkArticles(abs, name) : walkDir(abs, name)).map(
        stripCreated
      )
      const indexLink = folderIndexLink(abs, name)
      return {
        text: SECTION_LABELS[name] ?? name,
        collapsed: name !== '00-Overview',
        ...(indexLink ? { link: indexLink } : {}),
        items
      } satisfies SidebarItem
    })
    .filter((x): x is SidebarItem => x !== null)
}

/** 文章侧栏：近期收成一组，只露出短标签；作者系列和更早默认折上。 */
const ARTICLE_RECENT_LIMIT = 6

function walkArticles(abs: string, rel: string): RankedItem[] {
  const series: RankedItem[] = []
  const loose: RankedItem[] = []
  const sources = fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-CN', { numeric: true })
  )

  for (const source of sources) {
    if (SKIP_DIRS.has(source.name) || source.name.startsWith('.')) continue
    if (!source.isDirectory()) continue
    const sourceAbs = path.join(abs, source.name)
    const sourceRel = `${rel}/${source.name}`
    const entries = fs.readdirSync(sourceAbs, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name, 'zh-CN', { numeric: true })
    )

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue
      const childAbs = path.join(sourceAbs, entry.name)
      const childRel = `${sourceRel}/${entry.name}`

      if (entry.isDirectory()) {
        const children = walkDir(childAbs, childRel)
        if (children.length === 0) continue
        children.sort(byCreatedNewest)
        const indexLink = folderIndexLink(childAbs, childRel)
        series.push({
          text: displayName(entry.name),
          collapsed: true,
          created: newestCreated(children),
          ...(indexLink ? { link: indexLink } : {}),
          items: children
        })
        continue
      }

      if (!entry.name.endsWith('.md') || SKIP_FILES.has(entry.name)) continue
      if (/^00-索引\.md$/.test(entry.name)) continue
      loose.push(articleItem(childAbs, childRel))
    }
  }

  loose.sort(byCreatedNewest)
  series.sort((a, b) => a.text.localeCompare(b.text, 'zh-CN', { numeric: true }))

  const recent = loose.slice(0, ARTICLE_RECENT_LIMIT)
  const older = loose.slice(ARTICLE_RECENT_LIMIT)
  const items: RankedItem[] = []
  if (recent.length > 0) {
    items.push({
      text: '近期',
      collapsed: false,
      created: recent[0]?.created ?? '',
      items: recent
    })
  }
  items.push(...series)
  if (older.length > 0) {
    items.push({
      text: '更早',
      collapsed: true,
      created: older[0]?.created ?? '',
      items: older
    })
  }
  return items
}

function articleItem(abs: string, rel: string): RankedItem {
  return {
    text: sidebarLabel(abs, path.basename(rel)),
    link: mdPathToUrl(rel),
    created: noteCreated(abs)
  }
}

function walkDir(abs: string, rel: string): RankedItem[] {
  const entries = fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-CN', { numeric: true })
  )

  const items: RankedItem[] = []

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue
    const childAbs = path.join(abs, entry.name)
    const childRel = `${rel}/${entry.name}`

    if (entry.isDirectory()) {
      const children = walkDir(childAbs, childRel)
      if (children.length === 0) continue
      const indexLink = folderIndexLink(childAbs, childRel)
      items.push({
        text: displayName(entry.name),
        collapsed: true,
        created: newestCreated(children),
        ...(indexLink ? { link: indexLink } : {}),
        items: children
      })
      continue
    }

    if (!entry.name.endsWith('.md') || SKIP_FILES.has(entry.name)) continue
    if (/^README\.md$/i.test(entry.name) || /^00-索引\.md$/.test(entry.name)) {
      continue
    }
    items.push(
      rel.startsWith('01-Articles/')
        ? articleItem(childAbs, childRel)
        : {
            text: noteTitle(childAbs, entry.name),
            link: mdPathToUrl(childRel),
            created: noteCreated(childAbs)
          }
    )
  }

  if (rel.startsWith('01-Articles/')) {
    items.sort(byCreatedNewest)
  }

  return items
}

function byCreatedNewest(a: RankedItem, b: RankedItem): number {
  if (a.created !== b.created) return b.created.localeCompare(a.created)
  return a.text.localeCompare(b.text, 'zh-CN', { numeric: true })
}

function newestCreated(items: RankedItem[]): string {
  return items.reduce((best, item) => (item.created > best ? item.created : best), '')
}

function noteCreated(abs: string): string {
  const match = frontmatter(abs).match(/^created:\s*['"]?(\d{4}-\d{2}-\d{2})/m)
  return match?.[1] ?? ''
}

function stripCreated(item: RankedItem): SidebarItem {
  const { created: _created, items, ...rest } = item
  return items ? { ...rest, items: items.map((child) => stripCreated(child as RankedItem)) } : rest
}

function folderIndexLink(abs: string, rel: string): string | undefined {
  for (const name of ['README.md', '00-索引.md', 'index.md']) {
    const candidate = path.join(abs, name)
    if (fs.existsSync(candidate)) return mdPathToUrl(`${rel}/${name}`)
  }
  return undefined
}

function sidebarLabel(abs: string, filename: string): string {
  const fm = frontmatter(abs)
  const nav = fm.match(/^nav:\s*(.+)$/m)
  if (nav) return stripQuotes(nav[1].trim())
  return noteTitle(abs, filename)
}

function noteTitle(abs: string, filename: string): string {
  const fallback = displayName(filename.replace(/\.md$/i, ''))
  const fm = frontmatter(abs)
  if (fm) {
    const title = fm.match(/^title:\s*(.+)$/m)
    if (title) return stripQuotes(title[1].trim())
  }
  const heading = fs.readFileSync(abs, 'utf8').match(/^#\s+(.+)$/m)
  if (heading) return heading[1].trim()
  return fallback
}

function frontmatter(abs: string): string {
  const text = fs.readFileSync(abs, 'utf8')
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return fm?.[1] ?? ''
}

function displayName(name: string): string {
  return name.replace(/^\d{2}-/, '')
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '')
}
