<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import InlineEdit from '@/components/InlineEdit.vue'
import type { DragPlatformData, Platform } from '@/types'

const props = defineProps<{
  platform: Platform
  platformId: string
  index: number
  autoEdit?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const store = useCompetitionStore()

const headerEl = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  headerEl,
  { groups: ['platform'], activation: { distance: 3 } },
  () =>
    [
      props.index,
      [
        {
          type: 'platform',
          platformId: props.platformId,
          index: props.index,
        } satisfies DragPlatformData,
      ],
    ] as [number, DragPlatformData[]],
)
</script>

<template>
  <div
    ref="headerEl"
    data-platform-header
    class="group flex items-center gap-1 cursor-grab border-t border-l border-gray-300 bg-gray-50 px-1 py-1.5 text-center text-xs font-semibold text-gray-500"
    :class="isDragging ? 'opacity-40' : ''"
  >
    <span class="opacity-50 select-none">⠿</span>
    <InlineEdit
      :model-value="platform.name"
      placeholder="Name"
      :auto-edit="autoEdit"
      class="mx-auto"
      @update:model-value="store.renamePlatform(platformId, $event)"
    />
    <button
      class="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
      title="Remove platform"
      @click.stop="emit('remove')"
    >
      &times;
    </button>
  </div>
</template>
