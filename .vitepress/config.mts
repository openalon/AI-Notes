import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { gtmHead, injectGtmNoscript } from './gtm'
import { collectNotes, obsidianMarkdown } from './obsidian'
import { buildSidebar } from './sidebar'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const notes = collectNotes()
const sidebar = buildSidebar()
const isGithubActions = Boolean(process.env.GITHUB_ACTIONS)
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = isGithubActions && repoName ? `/${repoName}/` : '/'

const BOOK_PDFS = [
  '03-HarnessEngineering/Book1-ClaudeCode/book1-claude-code.pdf',
  '03-HarnessEngineering/Book2-Comparing/book2-comparing.pdf'
]

function copyBookPdfs() {
  return {
    name: 'copy-book-pdfs',
    closeBundle() {
      const dist = path.join(ROOT, '.vitepress/dist')
      for (const rel of BOOK_PDFS) {
        const from = path.join(ROOT, rel)
        const to = path.join(dist, rel)
        if (!fs.existsSync(from)) continue
        fs.mkdirSync(path.dirname(to), { recursive: true })
        fs.copyFileSync(from, to)
      }
    }
  }
}

export default defineConfig({
  srcExclude: [
    'README.md',
    '**/node_modules/**',
    '**/.obsidian/**',
    '**/.claude/**',
    '**/.remember/**',
    '04-GameDesignWorkshop/*.pdf'
  ],
  ignoreDeadLinks: true,
  base,
  lang: 'zh-CN',
  title: 'AI Notes',
  description: 'AI 时代的文章学习总结、概念整理与模式沉淀',
  lastUpdated: true,
  cleanUrls: true,

  transformHtml(code) {
    return injectGtmNoscript(code)
  },
  head: [...gtmHead],

  markdown: {
    config(md) {
      md.use(obsidianMarkdown(notes))
    }
  },

  themeConfig: {
    nav: [
      { text: '总览', link: '/00-Overview/AI知识库总览' },
      { text: '文章', link: '/01-Articles/' },
      { text: '思考', link: '/02-Thoughts/Agent-native 软件基础设施与工作流' },
      {
        text: '书籍',
        items: [
          { text: 'Harness Engineering', link: '/03-HarnessEngineering/' },
          { text: 'Game Design Workshop', link: '/04-GameDesignWorkshop/' },
          { text: 'Claude Cookbooks', link: '/05-ClaudeCookbooks/' }
        ]
      }
    ],
    sidebar,
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/openalon/AI-Notes' }
    ]
  },

  vite: {
    plugins: [copyBookPdfs()],
    server: {
      // 避开本机其他 VitePress 常用的 5173。
      // 显式绑 IPv4：默认只听 [::1] 时，浏览器打开 127.0.0.1:5280 会被拒绝。
      host: '127.0.0.1',
      port: 5280
    }
  }
})
