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
  readonly?: boolean
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
    class="group flex items-center gap-1 rounded-lg bg-card/50 px-1 py-1.5 text-center text-sm font-semibold glass glass-card hover:bg-muted has-[[data-grip]:focus-visible]:z-10 has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
    :class="[isDragging ? 'opacity-40' : '', readonly ? 'pointer-events-none' : 'cursor-grab']"
  >
    <span
      data-grip
      :tabindex="readonly ? -1 : 0"
      class="outline-none select-none"
      :class="readonly ? 'invisible' : 'opacity-50'"
      >⠿</span
    >
    <InlineEdit
      :model-value="platform.name"
      placeholder="Name"
      :auto-edit="autoEdit"
      :readonly="readonly"
      class="mx-auto"
      @update:model-value="store.renamePlatform(platformId, $event)"
    />
    <button
      :tabindex="readonly ? -1 : 0"
      class="ml-1 flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover:opacity-100 group-has-focus-visible:opacity-100"
      :class="{ 'invisible pointer-events-none': readonly }"
      title="Remove platform"
      @click.stop="emit('remove')"
      @keydown.stop
    >
      &times;
    </button>
  </div>
</template>
