<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import DanceRow from '@/components/DanceRow.vue'
import type { ScheduleEvent } from '@/types'

defineProps<{
  event: ScheduleEvent
  blockId: string
  eventId: string
}>()

const store = useCompetitionStore()
</script>

<template>
  <tbody>
    <tr>
      <th
        :colspan="store.platformEntries.length + 1"
        class="border border-gray-300 bg-gray-100 px-3 py-2 text-left text-sm font-semibold"
      >
        {{ event.name }}
        <span v-if="event.description" class="ml-2 font-normal text-gray-500">
          {{ event.description }}
        </span>
      </th>
    </tr>
    <template v-if="event.dances">
      <DanceRow
        v-for="[danceId, scheduledDance] in Object.entries(event.dances)"
        :key="danceId"
        :scheduled-dance="scheduledDance"
        :block-id="blockId"
        :event-id="eventId"
        :dance-id="danceId"
      />
    </template>
    <tr v-else>
      <td
        :colspan="store.platformEntries.length + 1"
        class="border border-gray-200 px-3 py-3 text-center text-sm text-gray-400 italic"
      >
        {{ event.description || 'No dances' }}
      </td>
    </tr>
  </tbody>
</template>
