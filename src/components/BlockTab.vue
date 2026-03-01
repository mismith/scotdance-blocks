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
    class="group flex cursor-grab items-center justify-between rounded-t-lg border px-3 text-sm font-medium transition-colors has-[[data-grip]:focus-visible]:z-10 has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
    :class="[
      active
        ? '-mb-px border-border border-b-card bg-card text-foreground glass glass-card'
        : 'border-transparent text-muted-foreground hover:bg-muted hover:text-accent-foreground',
      isDragging ? 'opacity-40' : '',
    ]"
    role="button"
    @click="emit('select')"
  >
    <div class="flex items-center gap-1">
      <span data-grip tabindex="0" class="-ml-1 mr-1 opacity-50 outline-none select-none">⠿</span>
      <InlineEdit
        v-if="active"
        :model-value="block.name"
        placeholder="Block name"
        :auto-edit="autoEdit"
        @update:model-value="store.renameBlock(blockId, $event)"
      />
      <button
        v-else
        class="rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click.stop="emit('select')"
        @keydown.enter.stop
        @keydown.space.stop
      >
        {{ block.name || 'Block name' }}
      </button>
    </div>
    <button
      class="ml-2 -mr-1 flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover:opacity-100 group-has-focus-visible:opacity-100"
      title="Remove block"
      @click.stop="emit('remove')"
      @keydown.stop
    >
      &times;
    </button>
  </div>
</template>
