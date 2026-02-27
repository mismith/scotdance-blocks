<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

const props = defineProps<{
  blockId: string
  eventId: string
}>()

const store = useCompetitionStore()
const selectedDanceId = ref('')

const availableDances = computed(() => Object.entries(store.dances))

function onSelect() {
  if (!selectedDanceId.value) return
  store.addDanceToEvent(props.blockId, props.eventId, selectedDanceId.value)
  selectedDanceId.value = ''
}
</script>

<template>
  <select
    v-model="selectedDanceId"
    class="border-0 bg-transparent py-0.5 text-sm text-gray-500 focus:ring-1 focus:ring-blue-300"
    @change="onSelect"
  >
    <option value="">+ Add dance...</option>
    <option
      v-for="[danceId, dance] in availableDances"
      :key="danceId"
      :value="danceId"
    >
      {{ dance.shortName || dance.name }}{{ dance.steps ? ` (${dance.steps})` : '' }}
    </option>
  </select>
</template>
