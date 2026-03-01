<script setup lang="ts">
import { DnDProvider } from '@vue-dnd-kit/core'
import { useMagicKeys, useRefHistory, whenever } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { RouterView } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'
import { useDensity } from '@/composables/useDensity'
import ScheduleSidebar from '@/components/ScheduleSidebar.vue'

const store = useCompetitionStore()
const { comfortable } = useDensity()
const { data } = storeToRefs(store)

const { undo, redo } = useRefHistory(data, {
  deep: true,
  capacity: 100,
  clone: (val) => JSON.parse(JSON.stringify(val)),
})

function isEditingText() {
  const el = document.activeElement
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable)
}

const keys = useMagicKeys()
whenever(
  () => keys['Meta+z'].value && !isEditingText(),
  () => undo(),
)
whenever(
  () => keys['Ctrl+z'].value && !isEditingText(),
  () => undo(),
)
whenever(
  () => keys['Meta+Shift+z'].value && !isEditingText(),
  () => redo(),
)
whenever(
  () => keys['Ctrl+Shift+z'].value && !isEditingText(),
  () => redo(),
)
whenever(
  () => keys['Ctrl+y'].value && !isEditingText(),
  () => redo(),
)
</script>

<template>
  <div class="flex h-screen select-none flex-col">
    <header class="flex items-center gap-4 border-b border-border bg-muted px-4 py-3">
      <h1 class="text-lg font-bold text-foreground">ScotDance Blocks</h1>
      <div class="ml-auto flex items-center gap-3">
        <button
          class="rounded px-2 py-1 text-xs text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring comfortable:px-3 comfortable:py-1.5 comfortable:text-sm"
          :title="comfortable ? 'Switch to compact view' : 'Switch to comfortable view'"
          @click="comfortable = !comfortable"
        >
          {{ comfortable ? 'Compact' : 'Comfortable' }}
        </button>
        <label class="flex items-center gap-1.5 text-xs text-muted-foreground comfortable:text-sm">
          <input
            type="checkbox"
            class="size-3.5 cursor-default accent-primary comfortable:size-4"
            :checked="store.collectionsReadonly"
            @change="store.collectionsReadonly = ($event.target as HTMLInputElement).checked"
          />
          Read-only collections
        </label>
      </div>
    </header>

    <DnDProvider overlay-to="body">
      <div class="flex flex-1 overflow-hidden">
        <ScheduleSidebar />
        <RouterView class="flex-1 overflow-hidden" />
      </div>
    </DnDProvider>
  </div>
</template>
