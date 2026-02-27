<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import type { CellLocation, DragJudgeData } from '@/types'

const props = defineProps<{
  label: string
  judgeId: string
  index?: number
  source?: CellLocation | 'palette'
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const el = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  el,
  { groups: ['judge'], activation: { distance: 3 } },
  () =>
    [
      props.index ?? 0,
      [
        {
          type: 'judge',
          judgeId: props.judgeId,
          index: props.index ?? 0,
          source: props.source ?? 'palette',
        } satisfies DragJudgeData,
      ],
    ] as [number, DragJudgeData[]],
)
</script>

<template>
  <span
    ref="el"
    data-judge-chip
    class="group/chip flex items-center cursor-grab rounded bg-amber-100 px-2 py-1 text-xs font-medium italic leading-tight text-amber-800 select-none"
    :class="{ 'opacity-40': isDragging }"
  >
    <span class="mr-1 -ml-1 not-italic text-amber-400">⠿</span
    ><span class="flex-1">{{ label }}</span>
    <button
      v-if="removable"
      class="ml-2 text-amber-400 opacity-0 transition-opacity hover:text-red-500 group-hover/chip:opacity-100"
      title="Remove"
      @click.stop="emit('remove')"
    >
      &times;
    </button>
  </span>
</template>
