<script setup lang="ts">
import { useScroll } from '@vueuse/core'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import DancePalette from '@/components/DancePalette.vue'
import GroupPalette from '@/components/GroupPalette.vue'
import JudgePalette from '@/components/JudgePalette.vue'

const route = useRoute()

const sidebarEl = ref<HTMLElement | null>(null)
const { arrivedState } = useScroll(sidebarEl, { offset: { top: 5, bottom: 5 } })
</script>

<template>
  <aside
    ref="sidebarEl"
    class="relative flex min-w-64 flex-col gap-4 overflow-y-auto border-r border-border px-3"
  >
    <div
      class="pointer-events-none sticky top-0 -mx-3 h-0 z-10 transition-opacity"
      :class="arrivedState.top ? 'opacity-0' : 'opacity-100'"
    >
      <div
        class="h-16 bg-linear-to-b from-background to-transparent backdrop-blur-md mask-[linear-gradient(to_bottom,black_33%,transparent)]"
      />
    </div>
    <DancePalette />
    <GroupPalette />
    <JudgePalette v-if="!route.meta.isDanceGroups" />
    <div
      class="pointer-events-none sticky bottom-0 -mx-3 h-0 z-10 transition-opacity"
      :class="arrivedState.bottom ? 'opacity-0' : 'opacity-100'"
    >
      <div
        class="h-16 -mt-16 bg-linear-to-t from-background to-transparent backdrop-blur-md mask-[linear-gradient(to_top,black_33%,transparent)]"
      />
    </div>
  </aside>
</template>
