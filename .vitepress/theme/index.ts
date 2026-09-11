import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import { defineComponent, h, nextTick, onMounted, watch } from 'vue'
import Comments from './Comments.vue'
import Footer from './Footer.vue'
import { renderMermaid } from './mermaid'
import './custom.css'

const Layout = defineComponent({
  name: 'AppLayout',
  setup() {
    const route = useRoute()

    onMounted(() => {
      void renderMermaid()
    })
    watch(
      () => route.path,
      () => {
        void nextTick(() => renderMermaid())
      }
    )

    return () =>
      h(DefaultTheme.Layout, null, {
        'doc-after': () => h(Comments),
        'layout-bottom': () => h(Footer)
      })
  }
})

export default {
  extends: DefaultTheme,
  Layout
} satisfies Theme
