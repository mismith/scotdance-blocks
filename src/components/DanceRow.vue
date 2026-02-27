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

const handleEl = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  handleEl,
  { groups: ['dance'] },
  () =>
    [
      props.index,
      [
        {
          type: 'dance',
          scheduledDanceId: props.danceId,
          index: props.index,
          blockId: props.blockId,
          eventId: props.eventId,
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
    <div class="border border-gray-200 px-1 py-1.5 font-medium whitespace-nowrap">
      <div class="flex items-center gap-1">
        <span
          ref="handleEl"
          class="cursor-grab text-gray-300 opacity-0 transition-opacity select-none group-hover:opacity-100"
          title="Drag to reorder"
        >&#8942;&#8942;</span>
        <div class="flex flex-1 items-center justify-between">
          <div class="text-sm">
            {{ dance?.shortName ?? dance?.name ?? 'Unknown' }}
            <span v-if="dance?.steps" class="text-gray-400">({{ dance.steps }})</span>
            <span v-if="scheduledDance.name" class="ml-1 text-xs text-gray-500">
              {{ scheduledDance.name }}
            </span>
          </div>
          <button
            class="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            title="Remove dance"
            @click="store.removeDanceFromEvent(blockId, eventId, danceId)"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
    <PlatformCell
      v-for="[platformId] in store.platformEntries"
      :key="platformId"
      :assignment="scheduledDance.platforms[platformId]"
      :location="{ blockId, eventId, danceId, platformId }"
    />
    <div class="border border-gray-200" />
  </div>
</template>
