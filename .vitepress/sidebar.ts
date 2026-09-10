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
  '00-Maps': '地图',
  '01-Articles': '文章',
  '02-Thoughts': '思考',
  '03-HarnessEngineering': 'Harness Engineering',
  '04-GameDesignWorkshop': 'Game Design Workshop'
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
    '00-Maps',
    '01-Articles',
    '02-Thoughts',
    '03-HarnessEngineering',
    '04-GameDesignWorkshop'
  ]
  return sections
    .map((name) => {
      const abs = path.join(ROOT, name)
      if (!fs.existsSync(abs)) return null
      const items = walkDir(abs, name).map(stripCreated)
      const indexLink = folderIndexLink(abs, name)
      return {
        text: SECTION_LABELS[name] ?? name,
        collapsed: name !== '00-Maps',
        ...(indexLink ? { link: indexLink } : {}),
        items
      } satisfies SidebarItem
    })
    .filter((x): x is SidebarItem => x !== null)
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
      // 入库按来源分文件夹；网页侧栏不把 X / 其他 露出来。
      if (rel === '01-Articles') {
        items.push(...children)
        continue
      }
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
    items.push({
      text: noteTitle(childAbs, entry.name),
      link: mdPathToUrl(childRel),
      created: noteCreated(childAbs)
    })
  }

  if (rel === '01-Articles' || rel.startsWith('01-Articles/')) {
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
  const text = fs.readFileSync(abs, 'utf8')
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return ''
  const match = fm[1].match(/^created:\s*['"]?(\d{4}-\d{2}-\d{2})/m)
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

function noteTitle(abs: string, filename: string): string {
  const fallback = displayName(filename.replace(/\.md$/i, ''))
  const text = fs.readFileSync(abs, 'utf8')
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (fm) {
    const title = fm[1].match(/^title:\s*(.+)$/m)
    if (title) return stripQuotes(title[1].trim())
  }
  const heading = text.match(/^#\s+(.+)$/m)
  if (heading) return heading[1].trim()
  return fallback
}

function displayName(name: string): string {
  return name.replace(/^\d{2}-/, '')
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '')
}
