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
  autoEdit?: boolean
}>()

const emit = defineEmits<{
  select: []
  remove: []
}>()

const store = useCompetitionStore()

const tabEl = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  tabEl,
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
    ref="tabEl"
    data-block-tab
    class="group flex cursor-grab items-center justify-between rounded-t-lg border px-2 text-sm font-medium transition-colors"
    :class="[
      active
        ? '-mb-px border-gray-200 border-b-white bg-white text-gray-900'
        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700',
      isDragging ? 'opacity-40' : '',
    ]"
    role="button"
    @click="emit('select')"
  >
    <div class="flex items-center gap-1">
      <span class="-ml-1 mr-1 opacity-50 select-none">⠿</span>
      <InlineEdit
        :model-value="block.name"
        placeholder="Block name"
        :auto-edit="autoEdit"
        :class="{ 'pointer-events-none': !active }"
        @update:model-value="store.renameBlock(blockId, $event)"
      />
    </div>
    <button
      class="ml-2 -mr-1 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
      title="Remove block"
      @click.stop="emit('remove')"
    >
      &times;
    </button>
  </div>
</template>
