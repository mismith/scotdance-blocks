<script setup lang="ts">
import { makeDraggable, makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import DanceRow from '@/components/DanceRow.vue'
import DragIndicator from '@/components/DragIndicator.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import type { DragDanceData, DragEventData, ScheduleEvent } from '@/types'

const props = defineProps<{
  event: ScheduleEvent
  blockId: string
  eventId: string
  index: number
  autoEdit?: boolean
}>()

const store = useCompetitionStore()
const { provider, activeDragGroup } = useDragType()

const sectionEl = vueRef<HTMLElement | null>(null)
const eventHeaderEl = vueRef<HTMLElement | null>(null)

// --- Event drag (whole header row) ---
const { isDragging: isEventDragging } = makeDraggable(
  eventHeaderEl,
  { groups: ['event'], activation: { distance: 3 } },
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

// --- Dance drop zone ---
function getInsertIndex(pointerY: number): number | undefined {
  if (!sectionEl.value) return undefined
  const rows = sectionEl.value.querySelectorAll('[data-dance-row]')
  if (!rows.length) {
    const placeholder = sectionEl.value.querySelector('[data-dance-placeholder]')
    if (placeholder) {
      const rect = placeholder.getBoundingClientRect()
      return pointerY < rect.top + rect.height / 2 ? 0 : 1
    }
    return 0
  }
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) return i
  }
  return rows.length
}

const { isDragOver } = makeDroppable(sectionEl, {
  groups: ['dance'],
  events: {
    onDrop(event) {
      const dragData = event.payload?.items[0] as DragDanceData | undefined
      if (!dragData) return

      const pointerY = event.provider.pointer.value?.current.y ?? 0
      const insertIndex = getInsertIndex(pointerY)

      if (dragData.source === 'palette') {
        if (insertIndex !== undefined) {
          store.addDanceToEvent(
            props.blockId,
            props.eventId,
            dragData.danceId,
            undefined,
            insertIndex,
          )
        }
      } else if (
        dragData.source.eventId === props.eventId &&
        dragData.source.blockId === props.blockId
      ) {
        if (insertIndex !== undefined) {
          store.reorderDance(
            props.blockId,
            props.eventId,
            dragData.index,
            insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
          )
        }
      } else {
        if (insertIndex !== undefined) {
          store.moveDance(
            dragData.source.blockId,
            dragData.source.eventId,
            dragData.scheduledDanceId,
            props.blockId,
            props.eventId,
            insertIndex,
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
  const hasContent =
    (props.event.dances && Object.keys(props.event.dances).length > 0) || !!props.event.description
  if (hasContent && !confirm('Remove this event and all its contents?')) return
  store.removeEvent(props.blockId, props.eventId)
}
</script>

<template>
  <div
    ref="sectionEl"
    data-event-section
    class="col-span-full grid grid-cols-subgrid"
    :class="isEventDragging ? 'opacity-40' : ''"
  >
    <div class="group col-span-full">
      <div
        ref="eventHeaderEl"
        class="flex cursor-grab items-center justify-between border-t border-l border-input bg-accent px-1 py-1.5 text-left text-sm font-semibold has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
      >
        <div class="flex items-center gap-1">
          <span data-grip tabindex="0" class="opacity-50 outline-none select-none">⠿</span>
          <InlineEdit
            :model-value="event.name"
            placeholder="Event name"
            :auto-edit="autoEdit"
            @update:model-value="store.renameEvent(blockId, eventId, $event)"
          />
        </div>
        <button
          class="ml-2 flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover:opacity-100 group-has-focus-visible:opacity-100"
          title="Remove event"
          @click="onRemoveEvent"
          @keydown.stop
        >
          &times;
        </button>
      </div>
    </div>
    <div class="col-span-full border-t border-l border-border py-1.5 pr-1 pl-5 text-sm">
      <InlineEdit
        :model-value="event.description ?? ''"
        placeholder="Add event description"
        :required="false"
        @update:model-value="store.updateEventDescription(blockId, eventId, $event)"
      />
    </div>
    <div
      class="col-span-full grid grid-cols-subgrid"
      :class="isValidTarget ? 'bg-dance-muted' : ''"
    >
      <template v-if="event.dances && Object.keys(event.dances).length">
        <template
          v-for="([danceId, scheduledDance], danceIndex) in Object.entries(event.dances)"
          :key="danceId"
        >
          <DragIndicator
            v-if="isDragOver && liveDanceInsertIndex === danceIndex"
            class="col-span-full -my-px"
          />
          <DanceRow
            :scheduled-dance="scheduledDance"
            :block-id="blockId"
            :event-id="eventId"
            :dance-id="danceId"
            :index="danceIndex"
          />
        </template>
        <DragIndicator
          v-if="isDragOver && liveDanceInsertIndex === Object.keys(event.dances).length"
          class="col-span-full -my-px"
        />
      </template>
      <template v-else>
        <DragIndicator
          v-if="isDragOver && liveDanceInsertIndex === 0"
          class="col-span-full -my-px"
        />
        <div
          data-dance-placeholder
          class="col-span-full border-t border-l border-border px-1 py-1.5 text-center text-sm text-muted-foreground"
        >
          <div class="rounded border border-dashed border-input px-2 py-1">Drag dances here</div>
        </div>
        <DragIndicator
          v-if="isDragOver && liveDanceInsertIndex === 1"
          class="col-span-full -my-px"
        />
      </template>
    </div>
  </div>
</template>
