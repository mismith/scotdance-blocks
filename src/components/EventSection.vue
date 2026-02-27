<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import DanceAdder from '@/components/DanceAdder.vue'
import DanceRow from '@/components/DanceRow.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import type { ScheduleEvent } from '@/types'

const props = defineProps<{
  event: ScheduleEvent
  blockId: string
  eventId: string
}>()

const store = useCompetitionStore()

function onRemoveEvent() {
  if (!confirm('Remove this event and all its dances?')) return
  store.removeEvent(props.blockId, props.eventId)
}
</script>

<template>
  <tbody>
    <tr class="group">
      <th
        :colspan="store.platformEntries.length + 2"
        class="border border-gray-300 bg-gray-100 px-3 py-2 text-left text-sm font-semibold"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <InlineEdit
              :model-value="event.name"
              placeholder="Event name"
              @update:model-value="store.renameEvent(blockId, eventId, $event)"
            />
            <span v-if="event.description" class="font-normal text-gray-500">
              {{ event.description }}
            </span>
          </div>
          <button
            class="ml-2 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            title="Remove event"
            @click="onRemoveEvent"
          >
            &times;
          </button>
        </div>
      </th>
    </tr>
    <template v-if="event.dances && Object.keys(event.dances).length">
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
        :colspan="store.platformEntries.length + 2"
        class="border border-gray-200 px-3 py-3 text-center text-sm italic text-gray-400"
      >
        {{ event.description || 'No dances' }}
      </td>
    </tr>
    <tr>
      <td
        :colspan="store.platformEntries.length + 2"
        class="border border-dashed border-gray-200 px-3 py-1.5"
      >
        <DanceAdder :block-id="blockId" :event-id="eventId" />
      </td>
    </tr>
  </tbody>
</template>
