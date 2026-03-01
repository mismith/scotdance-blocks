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
    class="group flex items-center gap-1 cursor-grab border-t border-l border-input bg-muted px-1 py-1.5 text-center text-xs font-semibold text-muted-foreground has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
    :class="isDragging ? 'opacity-40' : ''"
  >
    <span data-grip tabindex="0" class="opacity-50 outline-none select-none">⠿</span>
    <InlineEdit
      :model-value="platform.name"
      placeholder="Name"
      :auto-edit="autoEdit"
      class="mx-auto"
      @update:model-value="store.renamePlatform(platformId, $event)"
    />
    <button
      class="ml-1 flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover:opacity-100 group-has-focus-visible:opacity-100"
      title="Remove platform"
      @click.stop="emit('remove')"
      @keydown.stop
    >
      &times;
    </button>
  </div>
</template>
