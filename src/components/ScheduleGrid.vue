<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import EventSection from '@/components/EventSection.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import type { ScheduleBlock } from '@/types'

const props = defineProps<{
  block: ScheduleBlock
  blockId: string
}>()

const store = useCompetitionStore()

function onAddPlatform() {
  store.addPlatform()
}

function onRemovePlatform(platformId: string) {
  if (!confirm('Remove this platform column? All assignments on it will be lost.')) return
  store.removePlatform(platformId)
}

function onAddEvent() {
  store.addEvent(props.blockId)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th
            class="border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Dance
          </th>
          <th
            v-for="[platformId, platform] in store.platformEntries"
            :key="platformId"
            class="group border border-gray-300 bg-gray-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            <div class="flex items-center justify-center gap-1">
              <span>Platform </span>
              <InlineEdit
                :model-value="platform.name"
                placeholder="Name"
                @update:model-value="store.renamePlatform(platformId, $event)"
              />
              <button
                class="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                title="Remove platform"
                @click="onRemovePlatform(platformId)"
              >
                &times;
              </button>
            </div>
          </th>
          <th
            class="border border-gray-300 bg-gray-50 px-3 py-2 text-center"
          >
            <button
              class="text-xs text-gray-400 hover:text-blue-600"
              title="Add platform"
              @click="onAddPlatform"
            >
              +
            </button>
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
      <tbody>
        <tr>
          <td
            :colspan="store.platformEntries.length + 2"
            class="border border-dashed border-gray-300 px-3 py-2 text-center"
          >
            <button
              class="text-sm text-gray-400 hover:text-blue-600"
              @click="onAddEvent"
            >
              + Add event
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
