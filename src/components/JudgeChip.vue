<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import type { CellLocation, DragJudgeData } from '@/types'

const props = defineProps<{
  label: string
  judgeId: string
  index?: number
  source?: CellLocation | 'palette'
}>()

const el = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  el,
  { groups: ['judge'] },
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
    class="inline-block cursor-grab rounded bg-amber-100 px-2 py-1 text-xs font-medium italic leading-tight text-amber-800 select-none"
    :class="{ 'opacity-40': isDragging }"
  >
    {{ label }}
  </span>
</template>
