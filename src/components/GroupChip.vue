<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import type { CellLocation, DragGroupData } from '@/types'

const props = defineProps<{
  label: string
  groupId: string
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
  { groups: ['group'], activation: { distance: 3 } },
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
    class="group/chip flex items-center cursor-grab rounded bg-blue-100 px-2 py-1 text-xs font-medium leading-tight text-blue-800 select-none"
    :class="{ 'opacity-40': isDragging }"
  >
    <span class="mr-1 -ml-1 text-blue-400">⠿</span><span class="flex-1">{{ label }}</span>
    <button
      v-if="removable"
      class="ml-2 text-blue-400 opacity-0 transition-opacity hover:text-red-500 group-hover/chip:opacity-100"
      title="Remove"
      @click.stop="emit('remove')"
    >
      &times;
    </button>
  </span>
</template>
