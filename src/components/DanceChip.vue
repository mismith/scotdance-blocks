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
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: []
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
          scheduledDanceId: '',
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
    class="group/chip flex items-center cursor-grab rounded bg-green-100 px-2 py-1 text-xs font-medium leading-tight text-green-800 select-none"
    :class="{ 'opacity-40': isDragging }"
  >
    <span class="mr-1 -ml-1 text-green-400">⠿</span>
    <span class="flex-1"><slot>{{ label }}<span v-if="steps" class="ml-1 text-green-800/50">({{ steps }})</span></slot></span>
    <button
      v-if="removable"
      class="ml-2 text-green-400 opacity-0 transition-opacity hover:text-red-500 group-hover/chip:opacity-100"
      title="Remove"
      @click.stop="emit('remove')"
    >
      &times;
    </button>
  </span>
</template>
