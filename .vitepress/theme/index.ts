import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import Comments from './Comments.vue'
import Footer from './Footer.vue'
import { renderMermaid } from './mermaid'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h(Comments),
      'layout-bottom': () => h(Footer)
    })
  },
  enhanceApp({ router }) {
    if (typeof window !== 'undefined') {
      void renderMermaid()
    }
    router.onAfterRouteChanged = () => {
      void renderMermaid()
    }
  }
} satisfies Theme
