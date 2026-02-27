<script setup lang="ts">
import { makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import EventSection from '@/components/EventSection.vue'
import PlatformHeader from '@/components/PlatformHeader.vue'
import type { DragEventData, DragPlatformData, ScheduleBlock } from '@/types'

const props = defineProps<{
  block: ScheduleBlock
  blockId: string
}>()

const store = useCompetitionStore()
const { provider, activeDragGroup } = useDragType()

const isEventValidTarget = computed(() => activeDragGroup.value === 'event')
const isPlatformValidTarget = computed(() => activeDragGroup.value === 'platform')

const gridCols = computed(
  () => `auto repeat(${store.platformEntries.length}, 1fr) auto`,
)

const gridEl = vueRef<HTMLElement | null>(null)
const headerRowEl = vueRef<HTMLElement | null>(null)

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
    <div
      ref="gridEl"
      class="w-full text-sm"
      :class="isEventValidTarget ? 'ring-1 ring-inset ring-blue-200' : ''"
      :style="{ display: 'grid', gridTemplateColumns: gridCols }"
    >
      <!-- Header row -->
      <div
        ref="headerRowEl"
        class="relative col-span-full grid grid-cols-subgrid"
        :class="isPlatformValidTarget ? 'ring-1 ring-inset ring-blue-200' : ''"
      >
        <div class="border border-gray-300 bg-gray-50 px-1 py-1.5" />
        <PlatformHeader
          v-for="([platformId, platform], platformIndex) in store.platformEntries"
          :key="platformId"
          :platform="platform"
          :platform-id="platformId"
          :index="platformIndex"
          @remove="onRemovePlatform(platformId)"
        />
        <div class="border border-gray-300 bg-gray-50 px-1 py-1.5 text-center">
          <button
            class="text-xs text-gray-400 hover:text-blue-600"
            title="Add platform"
            @click="onAddPlatform"
          >
            +
          </button>
        </div>
        <!-- Platform insertion indicator (absolute, no layout impact) -->
        <div
          v-if="isPlatformDragOver && livePlatformInsertIndex >= 0"
          class="absolute top-0 bottom-0 z-10 w-0.5 bg-blue-500"
          :style="{ left: indicatorLeftPx + 'px' }"
        />
      </div>

      <!-- Events -->
      <template v-for="([eventId, event], eventIndex) in eventEntries" :key="eventId">
        <div
          v-if="isDragOver && liveEventInsertIndex === eventIndex"
          class="col-span-full h-0.5 bg-blue-500"
        />
        <EventSection
          :event="event"
          :block-id="blockId"
          :event-id="eventId"
          :index="eventIndex"
        />
      </template>
      <div
        v-if="isDragOver && liveEventInsertIndex === eventEntries.length"
        class="col-span-full h-0.5 bg-blue-500"
      />

      <!-- Add event -->
      <div class="col-span-full border border-dashed border-gray-300 bg-gray-100 px-1 py-1.5 text-center">
        <button
          class="text-sm text-gray-400 hover:text-blue-600"
          @click="onAddEvent"
        >
          + Add event
        </button>
      </div>
    </div>
  </div>
</template>
