<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const REPO = 'openalon/AI-Notes'
const SCRIPT_SRC = 'https://utteranc.es/client.js'

const { isDark, page } = useData()
const route = useRoute()
const el = ref<HTMLElement | null>(null)

const show = computed(() => {
  const path = page.value.relativePath
  return path !== 'index.md' && !path.endsWith('/index.md')
})

function theme() {
  return isDark.value ? 'github-dark' : 'github-light'
}

function clear() {
  const node = el.value
  if (!node) return
  while (node.firstChild) node.removeChild(node.firstChild)
}

function inject() {
  if (!show.value || !el.value) return
  const script = document.createElement('script')
  script.src = SCRIPT_SRC
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('repo', REPO)
  script.setAttribute('issue-term', 'pathname')
  script.setAttribute('label', 'comment')
  script.setAttribute('theme', theme())
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
watch(show, remount)
watch(isDark, remount)
onBeforeUnmount(clear)
</script>

<template>
  <section v-if="show" class="note-comments">
    <div ref="el" />
  </section>
</template>
