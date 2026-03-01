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
    class="group/chip flex items-center cursor-grab rounded bg-group px-2 py-1 text-xs font-medium leading-tight text-group-foreground select-none has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
    :class="{ 'opacity-40': isDragging }"
  >
    <span data-grip tabindex="0" class="mr-1 -ml-1 opacity-50 outline-none select-none">⠿</span><span class="flex-1"><slot>{{ label }}</slot></span>
    <button
      v-if="removable"
      class="ml-2 flex size-4 shrink-0 items-center justify-center rounded text-group-foreground/50 opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover/chip:opacity-100 group-has-focus-visible/chip:opacity-100"
      title="Remove"
      @click.stop="emit('remove')"
      @keydown.stop
    >
      &times;
    </button>
  </span>
</template>
