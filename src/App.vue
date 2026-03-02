<script setup lang="ts">
import { DnDProvider } from '@vue-dnd-kit/core'
import { useMagicKeys, useRefHistory, whenever } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { RouterView } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'
import ScheduleSidebar from '@/components/ScheduleSidebar.vue'

const store = useCompetitionStore()
const { data } = storeToRefs(store)

const { undo, redo } = useRefHistory(data, {
  deep: true,
  capacity: 100,
  clone: (val) => JSON.parse(JSON.stringify(val)),
})

function isEditingText() {
  const el = document.activeElement
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  )
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
    <header class="flex items-center gap-3 border-b border-border px-4 py-3">
      <img src="/touchicon.png" alt="" class="size-7 rounded" />
      <h1 class="text-lg font-bold text-foreground">Blocks</h1>
      <div class="ml-auto flex items-center gap-3">
        <label class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            class="size-4 cursor-default accent-primary"
            :checked="store.collectionsReadonly"
            @change="store.collectionsReadonly = ($event.target as HTMLInputElement).checked"
          />
          Read-only collections
        </label>
      </div>
    </header>

    <DnDProvider overlay-to="body">
      <div class="flex flex-auto min-h-0">
        <ScheduleSidebar />
        <RouterView class="flex-auto min-w-0" />
      </div>
    </DnDProvider>
  </div>
</template>
