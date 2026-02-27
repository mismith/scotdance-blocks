<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import PlatformCell from '@/components/PlatformCell.vue'
import type { ScheduledDance } from '@/types'

const props = defineProps<{
  scheduledDance: ScheduledDance
  blockId: string
  eventId: string
  danceId: string
}>()

const store = useCompetitionStore()

const dance = store.getDance(props.scheduledDance.danceId)
</script>

<template>
  <tr class="hover:bg-gray-50">
    <td class="border border-gray-200 px-3 py-1.5 font-medium whitespace-nowrap">
      <div class="text-sm">
        {{ dance?.shortName ?? dance?.name ?? 'Unknown' }}
        <span v-if="dance?.steps" class="text-gray-400">({{ dance.steps }})</span>
      </div>
      <div v-if="scheduledDance.name" class="text-xs text-gray-500">
        {{ scheduledDance.name }}
      </div>
    </td>
    <PlatformCell
      v-for="[platformId] in store.platformEntries"
      :key="platformId"
      :assignment="scheduledDance.platforms[platformId]"
      :location="{ blockId, eventId, danceId, platformId }"
    />
  </tr>
</template>
