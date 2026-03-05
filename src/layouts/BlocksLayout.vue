<script setup lang="ts">
import { DnDProvider } from '@vue-dnd-kit/core'
import { useMagicKeys, useRefHistory, whenever } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import TouchIcon from '@/assets/touchicon.svg?component'
import { createEmptyData, useCompetitionStore } from '@/stores/competition'
import { usePersistence } from '@/composables/usePersistence'
import { usePreviewDialog } from '@/composables/usePreviewDialog'
import AuthMenu from '@/components/AuthMenu.vue'
import DanceGroupsDialog from '@/components/DanceGroupsDialog.vue'
import PreviewDialog from '@/components/PreviewDialog.vue'
import ScheduleSidebar from '@/components/ScheduleSidebar.vue'

const store = useCompetitionStore()
const { data } = storeToRefs(store)
const route = useRoute()
const { open: openPreview } = usePreviewDialog()
const { restore, startAutoSave, newCompetition } = usePersistence()

// Restore saved data before initialising undo history so history starts clean.
// If no saved data exists, ensure we start fresh (important when navigating from /demo).
if (!route.path.startsWith('/demo')) {
  if (!restore()) {
    store.loadData(createEmptyData())
  }
}

const { undo, redo } = useRefHistory(data, {
  deep: true,
  capacity: 100,
  clone: (val) => JSON.parse(JSON.stringify(val)),
})

startAutoSave()

function handleNew() {
  const hasData = Object.keys(data.value.schedule.blocks).length > 0
    || Object.keys(data.value.categories).length > 0
  if (hasData && !confirm('Start a new competition? Your current work is saved.')) return
  newCompetition()
}

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
      <RouterLink to="/" class="flex items-center gap-3 cursor-pointer hover:opacity-80">
        <TouchIcon class="size-7 rounded" />
        <span class="text-lg font-bold text-foreground">Blocks</span>
      </RouterLink>
      <div class="ml-auto flex items-center gap-3">
        <button
          class="rounded-lg bg-card px-2.5 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          @click="handleNew"
        >
          New
        </button>
        <button
          class="rounded-lg bg-card px-2.5 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          title="Paper preview"
          @click="openPreview"
        >
          Paper preview
        </button>
        <label class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            class="size-4 cursor-default accent-primary"
            :checked="store.collectionsReadonly"
            @change="store.collectionsReadonly = ($event.target as HTMLInputElement).checked"
          />
          Read-only collections
        </label>
        <AuthMenu />
      </div>
    </header>

    <DnDProvider overlay-to="body">
      <div class="flex flex-auto min-h-0">
        <ScheduleSidebar />
        <RouterView class="flex-auto min-w-0" />
      </div>
    </DnDProvider>
    <DanceGroupsDialog />
    <PreviewDialog />
  </div>
</template>
