<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import type { DragDanceData } from '@/types'

const props = defineProps<{
  danceId: string
  label: string
  steps?: string
  index?: number
  source?: { blockId: string; eventId: string } | 'palette'
}>()

const el = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  el,
  { groups: ['dance'], activation: { distance: 3 } },
  () =>
    [
      props.index ?? 0,
      [
        {
          type: 'dance',
          danceId: props.danceId,
          index: props.index ?? 0,
          source: props.source ?? 'palette',
        } satisfies DragDanceData,
      ],
    ] as [number, DragDanceData[]],
)
</script>

<template>
  <span
    ref="el"
    data-dance-chip
    class="flex items-center cursor-grab rounded bg-green-100 px-2 py-1 text-xs font-medium leading-tight text-green-800 select-none"
    :class="{ 'opacity-40': isDragging }"
  >
    {{ label }}<span v-if="steps" class="ml-1 text-green-500">({{ steps }})</span>
  </span>
</template>
