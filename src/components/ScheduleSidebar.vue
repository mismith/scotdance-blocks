<script setup lang="ts">
import { useScroll } from '@vueuse/core'
import { ref } from 'vue'

import DancePalette from '@/components/DancePalette.vue'
import GroupPalette from '@/components/GroupPalette.vue'
import JudgePalette from '@/components/JudgePalette.vue'

const sidebarEl = ref<HTMLElement | null>(null)
const { arrivedState } = useScroll(sidebarEl, { offset: { top: 5, bottom: 5 } })
</script>

<template>
  <aside
    ref="sidebarEl"
    class="flex min-w-64 flex-col gap-4 overflow-y-auto p-3"
    :class="{
      'scroll-fade-t-16': !arrivedState.top,
      'scroll-fade-b-16': !arrivedState.bottom,
    }"
  >
    <DancePalette />
    <GroupPalette />
    <JudgePalette />
  </aside>
</template>
