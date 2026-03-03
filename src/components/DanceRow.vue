<script setup lang="ts">
import { makeDraggable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import DanceChip from '@/components/DanceChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import PlatformCell from '@/components/PlatformCell.vue'
import type { DragDanceData, ScheduledDance } from '@/types'

const props = defineProps<{
  scheduledDance: ScheduledDance
  blockId: string
  eventId: string
  danceId: string
  index: number
  autoEdit?: boolean
}>()

const store = useCompetitionStore()

const dance = props.scheduledDance.danceId
  ? store.getDance(props.scheduledDance.danceId)
  : undefined

// Draggable handle for arbitrary dances (reference dances use DanceChip's built-in drag)
const arbitraryEl = vueRef<HTMLElement | null>(null)

const { isDragging } = makeDraggable(
  arbitraryEl,
  { groups: ['dance'], activation: { distance: 3 } },
  () =>
    [
      props.index,
      [
        {
          type: 'dance',
          danceId: props.scheduledDance.danceId,
          scheduledDanceId: props.danceId,
          index: props.index,
          source: { blockId: props.blockId, eventId: props.eventId },
        } satisfies DragDanceData,
      ],
    ] as [number, DragDanceData[]],
)

function hasAssignments() {
  return Object.values(props.scheduledDance.platforms).some(
    (a) => a.orderedGroupIds.length > 0 || a.orderedJudgeIds.length > 0,
  )
}

function onRemove() {
  if (hasAssignments() && !confirm('Remove this dance? It has group/judge assignments.')) return
  store.removeDanceFromEvent(props.blockId, props.eventId, props.danceId)
}
</script>

<template>
  <!-- Arbitrary dance: spans all columns as a single editable row -->
  <div
    v-if="!scheduledDance.danceId"
    data-dance-row
    class="group col-span-full border-t border-border first:border-t-0"
  >
    <div
      ref="arbitraryEl"
      class="flex cursor-grab items-start px-1 py-1.5 text-sm has-[[data-grip]:focus-visible]:z-10 has-[[data-grip]:focus-visible]:ring-2 has-[[data-grip]:focus-visible]:ring-ring"
      :class="{ 'opacity-40': isDragging }"
    >
      <span data-grip tabindex="0" class="mr-1 mt-px opacity-50 outline-none select-none">⠿</span>
      <div class="min-w-0 flex-1">
        <InlineEdit
          :model-value="scheduledDance.name"
          placeholder="Item name"
          :auto-edit="autoEdit"
          @update:model-value="store.updateScheduledDanceName(blockId, eventId, danceId, $event)"
        />
        <div class="py-1.5">
          <InlineEdit
            :model-value="scheduledDance.description ?? ''"
            placeholder="Add custom item description"
            :required="false"
            multiline
            @update:model-value="
              store.updateScheduledDanceDescription(blockId, eventId, danceId, $event)
            "
          />
        </div>
      </div>
      <button
        class="ml-2 flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover:opacity-100 group-has-focus-visible:opacity-100"
        title="Remove"
        @click="onRemove"
        @keydown.stop
      >
        &times;
      </button>
    </div>
  </div>

  <!-- Reference dance: DanceChip + platform cells -->
  <div
    v-else
    data-dance-row
    class="group col-span-full grid grid-cols-subgrid border-t border-border first:border-t-0"
  >
    <div class="px-1 py-1.5 font-medium whitespace-nowrap">
      <DanceChip
        :dance-id="scheduledDance.danceId"
        :label="dance?.shortName ?? dance?.name ?? 'Unknown'"
        :steps="dance?.steps"
        :index
        :source="{ blockId, eventId }"
        :scheduled-dance-id="danceId"
        removable
        @remove="onRemove"
      >
        {{ dance?.shortName ?? dance?.name ?? 'Unknown' }}
        <span v-if="dance?.steps" class="text-dance-foreground/50">({{ dance.steps }})</span>
        <span v-if="scheduledDance.name" class="ml-1 text-dance-foreground/50">
          {{ scheduledDance.name }}
        </span>
      </DanceChip>
    </div>
    <PlatformCell
      v-for="[platformId] in store.platformEntries"
      :key="platformId"
      :assignment="scheduledDance.platforms[platformId]"
      :location="{ blockId, eventId, danceId, platformId }"
    />
    <div />
  </div>
</template>
