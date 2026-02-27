<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import InlineEdit from '@/components/InlineEdit.vue'
import type { DragBlockData, ScheduleBlock } from '@/types'

const props = defineProps<{
  block: ScheduleBlock
  blockId: string
  index: number
  active: boolean
}>()

const emit = defineEmits<{
  select: []
  remove: []
}>()

const store = useCompetitionStore()

const handleEl = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  handleEl,
  { groups: ['block'], activation: { distance: 3 } },
  () =>
    [
      props.index,
      [
        {
          type: 'block',
          blockId: props.blockId,
          index: props.index,
        } satisfies DragBlockData,
      ],
    ] as [number, DragBlockData[]],
)
</script>

<template>
  <div
    data-block-tab
    class="group flex items-center justify-between border-b-2 px-2 py-1.5 text-sm font-medium transition-colors"
    :class="[
      active
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
      isDragging ? 'opacity-40' : '',
    ]"
    role="button"
    @click="emit('select')"
  >
    <div class="flex items-center gap-1">
      <span
        ref="handleEl"
        class="cursor-grab text-gray-300 select-none"
        title="Drag to reorder"
      >⠿</span>
      <InlineEdit
        :model-value="block.name"
        placeholder="Block name"
        @update:model-value="store.renameBlock(blockId, $event)"
      />
    </div>
    <button
      class="ml-2 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
      title="Remove block"
      @click.stop="emit('remove')"
    >
      &times;
    </button>
  </div>
</template>
