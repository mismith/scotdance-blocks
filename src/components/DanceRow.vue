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
  <tr class="group hover:bg-gray-50">
    <td class="border border-gray-200 px-3 py-1.5 font-medium whitespace-nowrap">
      <div class="flex items-center justify-between">
        <div class="text-sm">
          {{ dance?.shortName ?? dance?.name ?? 'Unknown' }}
          <span v-if="dance?.steps" class="text-gray-400">({{ dance.steps }})</span>
          <span v-if="scheduledDance.name" class="ml-1 text-xs text-gray-500">
            {{ scheduledDance.name }}
          </span>
        </div>
        <button
          class="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          title="Remove dance"
          @click="store.removeDanceFromEvent(blockId, eventId, danceId)"
        >
          &times;
        </button>
      </div>
    </td>
    <PlatformCell
      v-for="[platformId] in store.platformEntries"
      :key="platformId"
      :assignment="scheduledDance.platforms[platformId]"
      :location="{ blockId, eventId, danceId, platformId }"
    />
    <td class="border border-gray-200"></td>
  </tr>
</template>
