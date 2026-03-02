<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import DanceChip from '@/components/DanceChip.vue'
import PlatformCell from '@/components/PlatformCell.vue'
import type { ScheduledDance } from '@/types'

const props = defineProps<{
  scheduledDance: ScheduledDance
  blockId: string
  eventId: string
  danceId: string
  index: number
}>()

const store = useCompetitionStore()

const dance = store.getDance(props.scheduledDance.danceId)

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
  <div data-dance-row class="group col-span-full grid grid-cols-subgrid">
    <div class="border-t border-border px-1 py-1.5 font-medium whitespace-nowrap">
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
    <div class="border-t border-border" />
  </div>
</template>
