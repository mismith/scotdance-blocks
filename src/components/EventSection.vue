<script setup lang="ts">
import { makeDraggable, makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useAutoFill } from '@/composables/useAutoFill'
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
  if (!rows.length) return 0
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

// --- Autofill ---
const { autoPlaceDances, autoFillGroups, autoCycleJudges } = useAutoFill()
const showAutoFillMenu = vueRef(false)
const autoEditDanceId = vueRef<string | null>(null)

function onAddArbitraryDance() {
  const id = store.addDanceToEvent(props.blockId, props.eventId, undefined, 'New Item')
  autoEditDanceId.value = id
}

const hasDances = computed(() => !!props.event.dances && Object.keys(props.event.dances).length > 0)

function hasExistingGroups() {
  return Object.values(props.event.dances ?? {}).some((sd) =>
    Object.values(sd.platforms).some((a) => a.orderedGroupIds.length > 0),
  )
}
function hasExistingJudges() {
  return Object.values(props.event.dances ?? {}).some((sd) =>
    Object.values(sd.platforms).some((a) => a.orderedJudgeIds.length > 0),
  )
}

const categoryEntries = computed(() => Object.entries(store.categories))

function onAutoPlaceDances() {
  autoPlaceDances(props.blockId, props.eventId)
  showAutoFillMenu.value = false
}
function onAutoPlaceCategoryDances(categoryId: string) {
  autoPlaceDances(props.blockId, props.eventId, new Set([categoryId]))
  showAutoFillMenu.value = false
}
function onAutoFillGroups() {
  if (!hasDances.value) return
  if (hasExistingGroups() && !confirm('This will replace existing group assignments. Continue?'))
    return
  autoFillGroups(props.blockId, props.eventId)
  showAutoFillMenu.value = false
}
function onAutoCycleJudges() {
  if (!hasDances.value) return
  if (hasExistingJudges() && !confirm('This will replace existing judge assignments. Continue?'))
    return
  autoCycleJudges(props.blockId, props.eventId)
  showAutoFillMenu.value = false
}
</script>

<template>
  <div
    ref="sectionEl"
    data-event-section
    class="col-span-full grid grid-cols-subgrid mb-4"
    :class="isEventDragging ? 'opacity-40' : ''"
  >
    <div class="group col-span-full has-[[data-grip]:focus-visible]:z-10">
      <div
        ref="eventHeaderEl"
        class="flex cursor-grab items-center justify-between rounded-lg bg-accent px-1 py-1.5 text-left text-sm font-semibold glass glass-accent has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
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
        <div class="ml-auto flex items-center gap-1">
          <div class="relative">
            <button
              class="rainbow-rounded rainbow-border -my-0.5 flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs font-normal text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring comfortable:text-sm"
              title="Autofill"
              @click="showAutoFillMenu = !showAutoFillMenu"
              @keydown.stop
            >
              Autofill
              <svg class="size-3 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <Teleport to="body">
              <div
                v-if="showAutoFillMenu"
                class="fixed inset-0 z-40"
                @click="showAutoFillMenu = false"
              />
            </Teleport>
            <div
              v-if="showAutoFillMenu"
              class="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-lg border border-border bg-card p-1 font-normal shadow-lg"
            >
              <button
                v-for="[categoryId, category] in categoryEntries"
                :key="categoryId"
                class="flex w-full whitespace-nowrap rounded px-2 py-1.5 text-left text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                @click="onAutoPlaceCategoryDances(categoryId)"
              >
                Place {{ category.name }} dances
              </button>
              <button
                class="flex w-full whitespace-nowrap rounded px-2 py-1.5 text-left text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                @click="onAutoPlaceDances"
              >
                Place all dances
              </button>
              <div class="my-1 border-t border-border" />
              <button
                class="flex w-full whitespace-nowrap rounded px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="
                  hasDances
                    ? 'text-foreground hover:bg-muted'
                    : 'text-muted-foreground/50 pointer-events-none'
                "
                :disabled="!hasDances"
                @click="onAutoFillGroups"
              >
                Assign groups
              </button>
              <button
                class="flex w-full whitespace-nowrap rounded px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="
                  hasDances
                    ? 'text-foreground hover:bg-muted'
                    : 'text-muted-foreground/50 pointer-events-none'
                "
                :disabled="!hasDances"
                @click="onAutoCycleJudges"
              >
                Assign judges
              </button>
            </div>
          </div>
          <button
            class="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover:opacity-100 group-has-focus-visible:opacity-100"
            title="Remove event"
            @click="onRemoveEvent"
            @keydown.stop
          >
            &times;
          </button>
        </div>
      </div>
    </div>
    <div class="col-span-full border-border py-1.5 pr-1 pl-5 text-sm">
      <InlineEdit
        :model-value="event.description ?? ''"
        placeholder="Add event description"
        :required="false"
        multiline
        @update:model-value="store.updateEventDescription(blockId, eventId, $event)"
      />
    </div>
    <div
      class="relative isolate col-span-full grid grid-cols-subgrid"
      :class="
        isValidTarget
          ? 'bg-dance-muted before:absolute before:-inset-1 before:rounded-xl before:bg-dance-muted before:-z-10 before:pointer-events-none'
          : ''
      "
    >
      <template
        v-for="([danceId, scheduledDance], danceIndex) in Object.entries(event.dances ?? {})"
        :key="danceId"
      >
        <DragIndicator
          v-if="isDragOver && liveDanceInsertIndex === danceIndex"
          variant="dance"
          class="col-span-full -my-px"
        />
        <DanceRow
          :scheduled-dance="scheduledDance"
          :block-id="blockId"
          :event-id="eventId"
          :dance-id="danceId"
          :index="danceIndex"
          :auto-edit="autoEditDanceId === danceId"
        />
      </template>
      <DragIndicator
        v-if="isDragOver && liveDanceInsertIndex === Object.keys(event.dances ?? {}).length"
        variant="dance"
        class="col-span-full -my-px"
      />
      <button
        data-dance-placeholder
        class="col-span-full flex items-center gap-1 rounded-lg px-1 py-1 text-left text-sm font-medium text-muted-foreground outline-none glass glass-muted focus-visible:ring-2 focus-visible:ring-ring"
        @click="onAddArbitraryDance"
      >
        <span class="select-none">+</span> Add item or drag dances
      </button>
    </div>
  </div>
</template>
