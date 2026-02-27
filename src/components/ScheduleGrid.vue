<script setup lang="ts">
import { makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import EventSection from '@/components/EventSection.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import type { DragEventData, ScheduleBlock } from '@/types'

const props = defineProps<{
  block: ScheduleBlock
  blockId: string
}>()

const store = useCompetitionStore()
const { provider, activeDragGroup } = useDragType()

const isValidTarget = computed(() => activeDragGroup.value === 'event')

const tableEl = vueRef<HTMLElement | null>(null)

function getEventInsertIndex(pointerY: number): number | undefined {
  if (!tableEl.value) return undefined
  const sections = tableEl.value.querySelectorAll('[data-event-section]')
  if (!sections.length) return undefined
  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) return i
  }
  return sections.length
}

const { isDragOver } = makeDroppable(tableEl, {
  groups: ['event'],
  events: {
    onDrop(event) {
      const dragData = event.payload?.items[0] as DragEventData | undefined
      if (!dragData) return
      if (dragData.blockId !== props.blockId) return

      const pointerY = event.provider.pointer.value?.current.y ?? 0
      const insertIndex = getEventInsertIndex(pointerY)

      if (insertIndex !== undefined) {
        store.reorderEvent(
          props.blockId,
          dragData.index,
          insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
        )
      }
    },
  },
})

const liveEventInsertIndex = computed(() => {
  if (!isDragOver.value) return -1
  const pointerY = provider.pointer.value?.current.y
  if (pointerY === undefined) return -1
  return getEventInsertIndex(pointerY) ?? -1
})

function onAddPlatform() {
  store.addPlatform()
}

function onRemovePlatform(platformId: string) {
  if (!confirm('Remove this platform column? All assignments on it will be lost.')) return
  store.removePlatform(platformId)
}

function onAddEvent() {
  store.addEvent(props.blockId)
}

const eventEntries = computed(() => Object.entries(props.block.events))
</script>

<template>
  <div class="overflow-x-auto">
    <table ref="tableEl" class="w-full border-collapse text-sm" :class="isValidTarget ? 'ring-1 ring-inset ring-blue-200' : ''">
      <thead>
        <tr>
          <th
            class="border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Dance
          </th>
          <th
            v-for="[platformId, platform] in store.platformEntries"
            :key="platformId"
            class="group border border-gray-300 bg-gray-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            <div class="flex items-center justify-center gap-1">
              <span>Platform </span>
              <InlineEdit
                :model-value="platform.name"
                placeholder="Name"
                @update:model-value="store.renamePlatform(platformId, $event)"
              />
              <button
                class="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                title="Remove platform"
                @click="onRemovePlatform(platformId)"
              >
                &times;
              </button>
            </div>
          </th>
          <th
            class="border border-gray-300 bg-gray-50 px-3 py-2 text-center"
          >
            <button
              class="text-xs text-gray-400 hover:text-blue-600"
              title="Add platform"
              @click="onAddPlatform"
            >
              +
            </button>
          </th>
        </tr>
      </thead>
      <template v-for="([eventId, event], eventIndex) in eventEntries" :key="eventId">
        <tbody v-if="isDragOver && liveEventInsertIndex === eventIndex">
          <tr>
            <td :colspan="store.platformEntries.length + 2" class="h-0 p-0">
              <div class="h-0.5 bg-blue-500" />
            </td>
          </tr>
        </tbody>
        <EventSection
          :event="event"
          :block-id="blockId"
          :event-id="eventId"
          :index="eventIndex"
        />
      </template>
      <tbody v-if="isDragOver && liveEventInsertIndex === eventEntries.length">
        <tr>
          <td :colspan="store.platformEntries.length + 2" class="h-0 p-0">
            <div class="h-0.5 bg-blue-500" />
          </td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <td
            :colspan="store.platformEntries.length + 2"
            class="border border-dashed border-gray-300 px-3 py-2 text-center"
          >
            <button
              class="text-sm text-gray-400 hover:text-blue-600"
              @click="onAddEvent"
            >
              + Add event
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
