<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import PlatformCell from '@/components/PlatformCell.vue'
import type { DragDanceData, ScheduledDance } from '@/types'

const props = defineProps<{
  scheduledDance: ScheduledDance
  blockId: string
  eventId: string
  danceId: string
  index: number
}>()

const store = useCompetitionStore()

const dance = store.getDance(props.scheduledDance.danceId)

function hasAssignments() {
  return Object.values(props.scheduledDance.platforms).some(
    (a) => a.orderedGroupIds.length > 0 || a.orderedJudgeIds.length > 0,
  )
}

function onRemove() {
  if (hasAssignments() && !confirm('Remove this dance? It has group/judge assignments.')) return
  store.removeDanceFromEvent(props.blockId, props.eventId, props.danceId)
}

const nameCellEl = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  nameCellEl,
  { groups: ['dance'], activation: { distance: 3 } },
  () =>
    [
      props.index,
      [
        {
          type: 'dance',
          danceId: props.scheduledDance.danceId,
          scheduledDanceId: props.danceId,
          index: props.index,
          source: { blockId: props.blockId, eventId: props.eventId },
        } satisfies DragDanceData,
      ],
    ] as [number, DragDanceData[]],
)
</script>

<template>
  <div
    data-dance-row
    class="group col-span-full grid grid-cols-subgrid"
    :class="{ 'opacity-40': isDragging }"
  >
    <div
      ref="nameCellEl"
      class="group/cell cursor-grab border-t border-l border-border px-1 py-1.5 font-medium whitespace-nowrap has-[[data-grip]:focus-visible]:z-10 has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
    >
      <div
        class="group/chip flex items-center gap-1 rounded bg-dance px-2 py-1 text-xs font-medium leading-tight text-dance-foreground glass glass-dance comfortable:px-3 comfortable:py-1.5 comfortable:text-sm"
        :title="(dance?.shortName ?? dance?.name ?? 'Unknown') + (dance?.steps ? ` (${dance.steps})` : '')"
      >
        <span data-grip tabindex="0" class="opacity-50 -ml-1 outline-none select-none">⠿</span>
        <span class="max-w-64 flex-1 truncate">
          {{ dance?.shortName ?? dance?.name ?? 'Unknown' }}
          <span v-if="dance?.steps" class="text-dance-foreground/50">({{ dance.steps }})</span>
          <span v-if="scheduledDance.name" class="ml-1 text-dance-foreground/50">
            {{ scheduledDance.name }}
          </span>
        </span>
        <button
          class="ml-2 flex size-4 shrink-0 items-center justify-center rounded text-dance-foreground/50 opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover/chip:opacity-100 group-has-focus-visible/chip:opacity-100 comfortable:size-5"
          title="Remove dance"
          @click="onRemove"
          @keydown.stop
        >
          &times;
        </button>
      </div>
    </div>
    <PlatformCell
      v-for="[platformId] in store.platformEntries"
      :key="platformId"
      :assignment="scheduledDance.platforms[platformId]"
      :location="{ blockId, eventId, danceId, platformId }"
    />
    <div class="border-t border-l border-border" />
  </div>
</template>
