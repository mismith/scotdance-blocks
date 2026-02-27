<script setup lang="ts">
import { makeDraggable, makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import DanceAdder from '@/components/DanceAdder.vue'
import DanceRow from '@/components/DanceRow.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import type { DragDanceData, DragEventData, ScheduleEvent } from '@/types'

const props = defineProps<{
  event: ScheduleEvent
  blockId: string
  eventId: string
  index: number
}>()

const store = useCompetitionStore()
const { provider, activeDragGroup } = useDragType()

const tbodyEl = vueRef<HTMLElement | null>(null)
const eventHandleEl = vueRef<HTMLElement | null>(null)

// --- Event drag handle ---
const { isDragging: isEventDragging } = makeDraggable(
  eventHandleEl,
  { groups: ['event'] },
  () =>
    [
      props.index,
      [
        {
          type: 'event',
          eventId: props.eventId,
          index: props.index,
          blockId: props.blockId,
        } satisfies DragEventData,
      ],
    ] as [number, DragEventData[]],
)

// --- Dance drop zone (tbody) ---
function getInsertIndex(pointerY: number): number | undefined {
  if (!tbodyEl.value) return undefined
  const rows = tbodyEl.value.querySelectorAll('[data-dance-row]')
  if (!rows.length) return undefined
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) return i
  }
  return rows.length
}

const { isDragOver } = makeDroppable(tbodyEl, {
  groups: ['dance'],
  events: {
    onDrop(event) {
      const dragData = event.payload?.items[0] as DragDanceData | undefined
      if (!dragData) return

      const pointerY = event.provider.pointer.value?.current.y ?? 0
      const insertIndex = getInsertIndex(pointerY)

      if (dragData.eventId === props.eventId && dragData.blockId === props.blockId) {
        if (insertIndex !== undefined) {
          store.reorderDance(
            props.blockId,
            props.eventId,
            dragData.index,
            insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
          )
        }
      }
    },
  },
})

// Valid target: highlight when a dance is being dragged anywhere
const isValidTarget = computed(() => activeDragGroup.value === 'dance')

// Live insertion index for visual indicator
const liveDanceInsertIndex = computed(() => {
  if (!isDragOver.value) return -1
  const pointerY = provider.pointer.value?.current.y
  if (pointerY === undefined) return -1
  return getInsertIndex(pointerY) ?? -1
})

function onRemoveEvent() {
  if (!confirm('Remove this event and all its dances?')) return
  store.removeEvent(props.blockId, props.eventId)
}
</script>

<template>
  <tbody
    ref="tbodyEl"
    data-event-section
    :class="[isEventDragging ? 'opacity-40' : '', isValidTarget ? 'ring-1 ring-inset ring-blue-200' : '']"
  >
    <tr class="group">
      <th
        :colspan="store.platformEntries.length + 2"
        class="border border-gray-300 bg-gray-100 px-3 py-2 text-left text-sm font-semibold"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1">
            <span
              ref="eventHandleEl"
              class="cursor-grab text-gray-300 opacity-0 transition-opacity select-none group-hover:opacity-100"
              title="Drag to reorder"
            >&#8942;&#8942;</span>
            <InlineEdit
              :model-value="event.name"
              placeholder="Event name"
              @update:model-value="store.renameEvent(blockId, eventId, $event)"
            />
            <span v-if="event.description" class="font-normal text-gray-500">
              {{ event.description }}
            </span>
          </div>
          <button
            class="ml-2 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            title="Remove event"
            @click="onRemoveEvent"
          >
            &times;
          </button>
        </div>
      </th>
    </tr>
    <template v-if="event.dances && Object.keys(event.dances).length">
      <template v-for="([danceId, scheduledDance], danceIndex) in Object.entries(event.dances)" :key="danceId">
        <tr v-if="isDragOver && liveDanceInsertIndex === danceIndex">
          <td
            :colspan="store.platformEntries.length + 2"
            class="h-0 p-0"
          >
            <div class="h-0.5 bg-blue-500" />
          </td>
        </tr>
        <DanceRow
          :scheduled-dance="scheduledDance"
          :block-id="blockId"
          :event-id="eventId"
          :dance-id="danceId"
          :index="danceIndex"
        />
      </template>
      <tr v-if="isDragOver && liveDanceInsertIndex === Object.keys(event.dances).length">
        <td
          :colspan="store.platformEntries.length + 2"
          class="h-0 p-0"
        >
          <div class="h-0.5 bg-blue-500" />
        </td>
      </tr>
    </template>
    <tr v-else>
      <td
        :colspan="store.platformEntries.length + 2"
        class="border border-gray-200 px-3 py-3 text-center text-sm italic text-gray-400"
      >
        {{ event.description || 'No dances' }}
      </td>
    </tr>
    <tr>
      <td
        :colspan="store.platformEntries.length + 2"
        class="border border-dashed border-gray-200 px-3 py-1.5"
      >
        <DanceAdder :block-id="blockId" :event-id="eventId" />
      </td>
    </tr>
  </tbody>
</template>
