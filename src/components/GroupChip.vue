<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import type { CellLocation, DragGroupData } from '@/types'

const props = defineProps<{
  label: string
  groupId: string
  index?: number
  source?: CellLocation | 'palette'
}>()

const el = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  el,
  { groups: ['group'] },
  () =>
    [
      props.index ?? 0,
      [
        {
          type: 'group',
          groupId: props.groupId,
          index: props.index ?? 0,
          source: props.source ?? 'palette',
        } satisfies DragGroupData,
      ],
    ] as [number, DragGroupData[]],
)
</script>

<template>
  <span
    ref="el"
    data-group-chip
    class="inline-block cursor-grab rounded bg-blue-100 px-2 py-1 text-xs font-medium leading-tight text-blue-800 select-none"
    :class="{ 'opacity-40': isDragging }"
  >
    {{ label }}
  </span>
</template>
