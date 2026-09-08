<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()

const sources = computed(() => {
  const raw = frontmatter.value.source as unknown
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean)
  if (typeof raw === 'string') {
    const s = raw.trim()
    return s ? [s] : []
  }
  return []
})

const show = computed(
  () => page.value.relativePath !== 'index.md' && sources.value.length > 0
)

function isUrl(value: string) {
  return /^https?:\/\//i.test(value)
}
</script>

<template>
  <section v-if="show" class="note-source">
    <h2 class="note-source__title">出处</h2>
    <ul>
      <li v-for="item in sources" :key="item">
        <a v-if="isUrl(item)" :href="item" target="_blank" rel="noreferrer">{{ item }}</a>
        <span v-else>{{ item }}</span>
      </li>
    </ul>
  </section>
</template>
