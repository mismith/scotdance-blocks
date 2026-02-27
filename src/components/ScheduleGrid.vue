<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import EventSection from '@/components/EventSection.vue'
import type { ScheduleBlock } from '@/types'

defineProps<{
  block: ScheduleBlock
  blockId: string
}>()

const store = useCompetitionStore()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Dance
          </th>
          <th
            v-for="[platformId, platform] in store.platformEntries"
            :key="platformId"
            class="border border-gray-300 bg-gray-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Platform {{ platform.name }}
          </th>
        </tr>
      </thead>
      <EventSection
        v-for="[eventId, event] in Object.entries(block.events)"
        :key="eventId"
        :event="event"
        :block-id="blockId"
        :event-id="eventId"
      />
    </table>
  </div>
</template>
