<script setup lang="ts">
import { makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import DragIndicator from '@/components/DragIndicator.vue'
import EventSection from '@/components/EventSection.vue'
import PlatformHeader from '@/components/PlatformHeader.vue'
import type { DragEventData, DragPlatformData, ScheduleBlock } from '@/types'

const props = defineProps<{
  block: ScheduleBlock
  blockId: string
}>()

const store = useCompetitionStore()
const { provider } = useDragType()

const gridCols = computed(
  () =>
    `minmax(10rem, auto) repeat(${store.platformEntries.length}, minmax(14rem, 1fr)) minmax(2rem, auto)`,
)

const gridEl = ref<HTMLElement | null>(null)
const headerRowEl = ref<HTMLElement | null>(null)

// --- Event reorder (vertical) ---

function getEventInsertIndex(pointerY: number): number | undefined {
  if (!gridEl.value) return undefined
  const sections = gridEl.value.querySelectorAll('[data-event-section]')
  if (!sections.length) return undefined
  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) return i
  }
  return sections.length
}

const { isDragOver } = makeDroppable(gridEl, {
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

// --- Platform reorder (horizontal) ---

function getPlatformInsertIndex(pointerX: number): number | undefined {
  if (!headerRowEl.value) return undefined
  const headers = headerRowEl.value.querySelectorAll('[data-platform-header]')
  if (!headers.length) return undefined
  for (let i = 0; i < headers.length; i++) {
    const rect = headers[i].getBoundingClientRect()
    if (pointerX < rect.left + rect.width / 2) return i
  }
  return headers.length
}

const { isDragOver: isPlatformDragOver } = makeDroppable(headerRowEl, {
  groups: ['platform'],
  events: {
    onDrop(event) {
      if (store.collectionsReadonly) return
      const dragData = event.payload?.items[0] as DragPlatformData | undefined
      if (!dragData) return

      const pointerX = event.provider.pointer.value?.current.x ?? 0
      const insertIndex = getPlatformInsertIndex(pointerX)

      if (insertIndex !== undefined) {
        store.reorderPlatform(
          dragData.index,
          insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
        )
      }
    },
  },
})

const livePlatformInsertIndex = computed(() => {
  if (!isPlatformDragOver.value) return -1
  const pointerX = provider.pointer.value?.current.x
  if (pointerX === undefined) return -1
  return getPlatformInsertIndex(pointerX) ?? -1
})

// Absolute left position for platform insertion indicator
const indicatorLeftPx = computed(() => {
  if (!isPlatformDragOver.value || !headerRowEl.value) return 0
  const idx = livePlatformInsertIndex.value
  if (idx < 0) return 0
  const headers = headerRowEl.value.querySelectorAll('[data-platform-header]')
  const containerRect = headerRowEl.value.getBoundingClientRect()
  if (idx < headers.length) {
    return headers[idx].getBoundingClientRect().left - containerRect.left
  }
  if (headers.length > 0) {
    return headers[headers.length - 1].getBoundingClientRect().right - containerRect.left
  }
  return 0
})

const autoEditPlatformId = ref<string | null>(null)
const autoEditEventId = ref<string | null>(null)

function onAddPlatform() {
  autoEditPlatformId.value = store.addPlatform()
}

function onRemovePlatform(platformId: string) {
  const hasAssignments = Object.values(store.blocks).some((block) =>
    Object.values(block.events).some((event) =>
      Object.values(event.dances ?? {}).some((sd) => {
        const a = sd.platforms[platformId]
        return a && (a.orderedGroupIds.length > 0 || a.orderedJudgeIds.length > 0)
      }),
    ),
  )
  if (hasAssignments && !confirm('Remove this platform? It has assignments.')) return
  store.removePlatform(platformId)
}

function onAddEvent() {
  autoEditEventId.value = store.addEvent(props.blockId)
}

const eventEntries = computed(() => Object.entries(props.block.events))
</script>

<template>
  <div
    ref="gridEl"
    class="text-sm"
    :style="{
      display: 'grid',
      gridTemplateColumns: gridCols,
      minWidth: `max(100%, ${store.platformEntries.length * 12}rem)`,
    }"
  >
    <!-- Header row -->
    <div ref="headerRowEl" class="relative col-span-full grid grid-cols-subgrid gap-1 mb-4">
      <div class="px-1 py-1.5" />
      <PlatformHeader
        v-for="([platformId, platform], platformIndex) in store.platformEntries"
        :key="platformId"
        :platform="platform"
        :platform-id="platformId"
        :index="platformIndex"
        :auto-edit="autoEditPlatformId === platformId"
        :readonly="store.collectionsReadonly"
        @remove="onRemovePlatform(platformId)"
      />
      <div class="flex items-center justify-center px-1 py-1.5">
        <button
          :tabindex="store.collectionsReadonly ? -1 : 0"
          class="flex size-6 items-center justify-center rounded text-sm text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          :class="{ 'invisible pointer-events-none': store.collectionsReadonly }"
          title="Add platform"
          @click="onAddPlatform"
        >
          +
        </button>
      </div>
      <!-- Platform insertion indicator (absolute, no layout impact) -->
      <DragIndicator
        v-if="isPlatformDragOver && livePlatformInsertIndex >= 0"
        orientation="vertical"
        class="absolute! top-0 bottom-0"
        :style="{ left: indicatorLeftPx + 'px' }"
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
    <button
      class="col-span-full flex items-center gap-1 rounded-lg bg-accent/25 px-1 py-1.5 text-left text-sm font-semibold text-muted-foreground/50 outline-none glass glass-accent hover:bg-accent hover:text-accent-foreground focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
      @click="onAddEvent"
    >
      <span class="select-none">+</span>
      Add event
    </button>
  </div>
</template>
