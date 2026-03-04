<script setup lang="ts">
import { makeDraggable, makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import AddPopover from '@/components/AddPopover.vue'
import DragIndicator from '@/components/DragIndicator.vue'
import EventSection from '@/components/EventSection.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import { EVENT_CATEGORY_BUCKETS, EVENT_PRESETS } from '@/data/presets'
import type { DragBlockData, DragEventData, ScheduleBlock } from '@/types'

const props = defineProps<{
  block: ScheduleBlock
  blockId: string
  index: number
  autoEdit?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const store = useCompetitionStore()
const { provider } = useDragType()

const sectionEl = ref<HTMLElement | null>(null)
const blockHeaderEl = ref<HTMLElement | null>(null)

// --- Block drag (whole header row) ---
const { isDragging: isBlockDragging } = makeDraggable(
  blockHeaderEl,
  { groups: ['block'], activation: { distance: 3 } },
  () =>
    [
      props.index,
      [
        {
          type: 'block',
          blockId: props.blockId,
          index: props.index,
        } satisfies DragBlockData,
      ],
    ] as [number, DragBlockData[]],
)

// --- Event reorder (vertical) ---

function getEventInsertIndex(pointerY: number): number | undefined {
  if (!sectionEl.value) return undefined
  const sections = sectionEl.value.querySelectorAll('[data-event-section]')
  if (!sections.length) return undefined
  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) return i
  }
  return sections.length
}

const { isDragOver } = makeDroppable(sectionEl, {
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

const autoEditEventId = ref<string | null>(null)

// --- Event add popover ---
const showEventPopover = ref(false)
const addEventBtnEl = ref<HTMLElement | null>(null)

const eventPopoverItems = computed(() => {
  const existingNames = new Set(Object.values(props.block.events).map((e) => e.name))
  const categoryNames = new Set(Object.values(store.categories).map((c) => c.name))

  const items: { key: string; label: string }[] = []
  for (const name of EVENT_PRESETS) {
    if (!existingNames.has(name)) items.push({ key: name, label: name })
  }
  for (const bucket of EVENT_CATEGORY_BUCKETS) {
    const matching = bucket.filter((name) => categoryNames.has(name))
    if (matching.length > 0) {
      const combo = matching.join(' / ')
      if (!existingNames.has(combo)) items.push({ key: combo, label: combo })
    }
  }
  return items
})

function onAddEvent(name: string) {
  autoEditEventId.value = store.addEvent(props.blockId, name)
}

const eventEntries = computed(() => Object.entries(props.block.events))
</script>

<template>
  <div
    data-block-section
    class="col-span-full grid grid-cols-subgrid"
    :class="isBlockDragging ? 'opacity-40' : ''"
  >
    <div
      ref="sectionEl"
      class="col-span-full grid grid-cols-subgrid rounded-xl bg-card/50 px-3 py-3 glass glass-card"
    >
      <!-- Block header -->
      <div class="group col-span-full px-1 has-[[data-grip]:focus-visible]:z-10">
        <div
          ref="blockHeaderEl"
          class="flex cursor-grab items-center justify-between rounded-lg px-1 py-1.5 text-left font-semibold has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
        >
          <div class="flex items-center gap-1">
            <span data-grip tabindex="0" class="opacity-50 outline-none select-none">⠿</span>
            <InlineEdit
              :model-value="block.name"
              placeholder="Block name"
              :auto-edit="autoEdit"
              @update:model-value="store.renameBlock(blockId, $event)"
            />
          </div>
          <button
            class="ml-auto flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover:opacity-100 group-has-focus-visible:opacity-100"
            title="Remove block"
            @click="emit('remove')"
            @keydown.stop
          >
            &times;
          </button>
        </div>
      </div>

      <!-- Block description -->
      <div class="col-span-full border-border py-1 pr-1 pl-5 text-sm mb-4">
        <InlineEdit
          :model-value="block.description ?? ''"
          placeholder="Add block description"
          :required="false"
          multiline
          @update:model-value="store.updateBlockDescription(blockId, $event)"
        />
      </div>

      <!-- Events -->
      <template v-for="([eventId, event], eventIndex) in eventEntries" :key="eventId">
        <DragIndicator
          v-if="isDragOver && liveEventInsertIndex === eventIndex"
          class="col-span-full -my-px"
        />
        <EventSection
          :event="event"
          :block-id="blockId"
          :event-id="eventId"
          :index="eventIndex"
          :auto-edit="autoEditEventId === eventId"
        />
      </template>
      <DragIndicator
        v-if="isDragOver && liveEventInsertIndex === eventEntries.length"
        class="col-span-full -my-px"
      />

      <!-- Add event -->
      <div class="col-span-full px-1">
        <button
          ref="addEventBtnEl"
          class="flex min-h-9 w-full items-center gap-1 rounded-lg bg-accent/80 px-1 py-1.5 text-left text-sm font-semibold text-accent-foreground outline-none glass glass-accent hover:bg-accent focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
          @click="showEventPopover = !showEventPopover"
        >
          <span class="select-none">+</span>
          Add event
        </button>
        <AddPopover
          :anchor="addEventBtnEl"
          :open="showEventPopover"
          :items="eventPopoverItems"
          placeholder="Search events..."
          @close="showEventPopover = false"
          @select="onAddEvent($event.label)"
          @add="onAddEvent($event)"
        />
      </div>
    </div>
  </div>
</template>
