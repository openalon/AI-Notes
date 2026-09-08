import { nextTick } from 'vue'

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void
  run: (options: { nodes: HTMLElement[]; suppressErrors?: boolean }) => Promise<void>
}

let mermaid: MermaidApi | null = null

async function loadMermaid(): Promise<MermaidApi> {
  if (mermaid) return mermaid
  const mod = await import('mermaid')
  const api = (mod.default ?? mod) as MermaidApi
  api.initialize({
    startOnLoad: false,
    securityLevel: 'loose'
  })
  mermaid = api
  return api
}

export async function renderMermaid() {
  if (typeof window === 'undefined') return
  await nextTick()
  const blocks = [
    ...document.querySelectorAll<HTMLElement>('div.language-mermaid')
  ]
  if (blocks.length === 0) return

  const api = await loadMermaid()
  const nodes: HTMLElement[] = []

  for (const block of blocks) {
    if (block.dataset.mermaidRendered === '1') continue
    const code = block.querySelector('code')?.textContent
    if (!code?.trim()) continue
    const el = document.createElement('div')
    el.className = 'mermaid'
    el.textContent = code
    block.replaceWith(el)
    nodes.push(el)
  }

  if (nodes.length === 0) return
  await api.run({ nodes, suppressErrors: true })
  for (const el of nodes) el.dataset.mermaidRendered = '1'
}
