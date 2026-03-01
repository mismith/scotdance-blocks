<script setup lang="ts">
import { DnDProvider } from '@vue-dnd-kit/core'
import { useMagicKeys, useRefHistory, whenever } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { RouterView } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'

const store = useCompetitionStore()
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
    </header>

    <DnDProvider overlay-to="body">
      <RouterView class="flex-1 overflow-hidden" />
    </DnDProvider>
  </div>
</template>
