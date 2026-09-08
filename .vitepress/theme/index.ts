import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import Footer from './Footer.vue'
import Source from './Source.vue'
import { renderMermaid } from './mermaid'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-footer-before': () => h(Source),
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
