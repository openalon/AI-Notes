<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const REPO = 'openalon/AI-Notes'
const REPO_ID = 'R_kgDOUSa-YQ'
const CATEGORY = 'Announcements'
const CATEGORY_ID = 'DIC_kwDOUSa-Yc4DFKOK'
const SCRIPT_SRC = 'https://giscus.app/client.js'

const { isDark, frontmatter } = useData()
const route = useRoute()
const el = ref<HTMLElement | null>(null)

const term = computed(() => String(frontmatter.value.id ?? '').trim())
const ready = computed(() => Boolean(term.value && CATEGORY_ID))

function theme() {
  return isDark.value ? 'dark' : 'light'
}

function clear() {
  const node = el.value
  if (!node) return
  while (node.firstChild) node.removeChild(node.firstChild)
}

function inject() {
  if (!ready.value || !el.value) return
  const script = document.createElement('script')
  script.src = SCRIPT_SRC
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', REPO)
  script.setAttribute('data-repo-id', REPO_ID)
  script.setAttribute('data-category', CATEGORY)
  script.setAttribute('data-category-id', CATEGORY_ID)
  script.setAttribute('data-mapping', 'specific')
  script.setAttribute('data-term', term.value)
  script.setAttribute('data-strict', '1')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', theme())
  script.setAttribute('data-lang', 'zh-CN')
  el.value.appendChild(script)
}

async function remount() {
  if (typeof window === 'undefined') return
  clear()
  await nextTick()
  inject()
}

onMounted(remount)
watch(() => route.path, remount)
watch(term, remount)
watch(ready, remount)
watch(isDark, remount)
onBeforeUnmount(clear)
</script>

<template>
  <section v-if="term" class="note-comments">
    <div ref="el" />
  </section>
</template>
