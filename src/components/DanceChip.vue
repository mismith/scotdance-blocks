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
    class="group/chip flex min-w-0 items-center cursor-grab rounded bg-dance px-2 py-1 text-xs font-medium leading-tight text-dance-foreground select-none glass glass-dance has-[[data-grip]:focus-visible]:z-10 has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring comfortable:px-3 comfortable:py-1.5 comfortable:text-sm"
    :class="{ 'opacity-40': isDragging }"
    :title="label + (steps ? ` (${steps})` : '')"
  >
    <span data-grip tabindex="0" class="mr-1 -ml-1 opacity-50 outline-none select-none">⠿</span>
    <span class="max-w-64 flex-1 truncate"><slot>{{ label }}<span v-if="steps" class="ml-1 text-dance-foreground/50">({{ steps }})</span></slot></span>
    <button
      :tabindex="removable ? 0 : -1"
      class="ml-2 flex size-4 shrink-0 items-center justify-center rounded text-dance-foreground/50 opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover/chip:opacity-100 group-has-focus-visible/chip:opacity-100 comfortable:size-5"
      :class="{ 'invisible pointer-events-none': !removable }"
      title="Remove"
      @click.stop="emit('remove')"
      @keydown.stop
    >
      &times;
    </button>
  </span>
</template>
