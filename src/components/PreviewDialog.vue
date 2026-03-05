<script setup lang="ts">
import { ref, watch } from 'vue'

import { usePreviewDialog } from '@/composables/usePreviewDialog'
import { useScheduleExport } from '@/composables/useScheduleExport'

import SchedulePrintTable from '@/components/SchedulePrintTable.vue'

const { isOpen, close } = usePreviewDialog()
const { settings } = useScheduleExport()

const dialogEl = ref<HTMLDialogElement | null>(null)

watch(isOpen, (open) => {
  if (open) {
    dialogEl.value?.showModal()
  } else {
    dialogEl.value?.close()
  }
})

function onCancel(e: Event) {
  e.preventDefault()
  close()
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialogEl.value) close()
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="m-auto max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground p-0 shadow-lg backdrop:bg-background/60 backdrop:backdrop-blur-sm sm:max-h-[calc(100%-4rem)] sm:max-w-[calc(100%-4rem)] lg:max-h-[calc(100%-6rem)] lg:max-w-[calc(100%-6rem)] open:flex"
    @cancel="onCancel"
    @click="onBackdropClick"
  >
    <!-- Header bar -->
    <div class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
      <h2 class="text-sm font-semibold text-foreground">Paper preview</h2>
      <button
        class="flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        title="Close"
        @click="close"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
          />
        </svg>
      </button>
    </div>

    <!-- Body: sidebar + preview -->
    <div class="flex min-h-0 flex-1">
      <!-- Settings sidebar -->
      <div class="flex w-48 shrink-0 flex-col gap-4 border-r border-border p-4 text-sm">
        <!-- Event layout -->
        <fieldset>
          <legend class="mb-1.5 text-xs font-medium text-muted-foreground">Events</legend>
          <label class="flex items-center gap-1.5">
            <input
              type="radio"
              name="eventLayout"
              class="size-3.5 cursor-default accent-primary"
              :checked="!settings.eventNameInColumn"
              @change="settings.eventNameInColumn = false"
            />
            Full-width row
          </label>
          <label class="mt-1 flex items-center gap-1.5">
            <input
              type="radio"
              name="eventLayout"
              class="size-3.5 cursor-default accent-primary"
              :checked="settings.eventNameInColumn"
              @change="settings.eventNameInColumn = true"
            />
            In first column
          </label>
        </fieldset>

        <!-- Checkboxes -->
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center gap-1.5">
            <input
              type="checkbox"
              class="size-3.5 cursor-default accent-primary"
              :checked="settings.showDescriptions"
              @change="settings.showDescriptions = ($event.target as HTMLInputElement).checked"
            />
            <span class="text-xs font-medium text-muted-foreground">Show descriptions</span>
          </label>
          <label class="flex items-center gap-1.5">
            <input
              type="checkbox"
              class="size-3.5 cursor-default accent-primary"
              :checked="settings.showHeaderLabels"
              @change="settings.showHeaderLabels = ($event.target as HTMLInputElement).checked"
            />
            <span class="text-xs font-medium text-muted-foreground">Header labels</span>
          </label>
          <label class="flex items-center gap-1.5">
            <input
              type="checkbox"
              class="size-3.5 cursor-default accent-primary"
              :checked="settings.showCompetitionName"
              @change="settings.showCompetitionName = ($event.target as HTMLInputElement).checked"
            />
            <span class="text-xs font-medium text-muted-foreground">Competition name</span>
          </label>
        </div>
      </div>

      <!-- Scrollable preview -->
      <div class="flex-1 overflow-auto p-4">
        <SchedulePrintTable class="rounded-lg p-4" />
      </div>
    </div>
  </dialog>
</template>
