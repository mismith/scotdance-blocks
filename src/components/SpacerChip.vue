<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import { generatePlaceholderId } from '@/utils/id'
import type { CellLocation, DragGroupData } from '@/types'

const props = defineProps<{
  groupId?: string
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
          groupId: props.groupId ?? generatePlaceholderId(),
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
    class="group/chip flex min-w-0 items-center cursor-grab rounded bg-group/25 px-3 py-1.5 text-sm font-medium leading-tight text-group-foreground/50 dark:text-group/50 select-none glass glass-group border-dashed! hover:bg-group/80 hover:text-group-foreground has-[[data-grip]:focus-visible]:z-10 has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
    :class="{ 'opacity-40': isDragging }"
    title="Spacer"
  >
    <span data-grip tabindex="0" class="mr-1 -ml-1 opacity-50 outline-none select-none">⠿</span>
    <span class="flex-1 truncate">Spacer</span>
    <span
      v-if="!removable"
      class="ml-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-group-foreground/25 text-[10px] text-group-foreground/25"
      title="Drag into a platform cell to add a visual gap between groups"
    >?</span>
    <button
      v-if="removable"
      tabindex="0"
      class="ml-2 flex size-5 shrink-0 items-center justify-center rounded text-group-foreground/50 opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover/chip:opacity-100 group-has-focus-visible/chip:opacity-100"
      title="Remove"
      @click.stop="emit('remove')"
      @keydown.stop
    >
      &times;
    </button>
  </span>
</template>
