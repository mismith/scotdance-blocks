<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import DanceChip from '@/components/DanceChip.vue'

const store = useCompetitionStore()
</script>

<template>
  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Dances</h3>
    <div class="flex flex-col gap-1">
      <DanceChip
        v-for="[danceId, dance] in Object.entries(store.dances)"
        :key="danceId"
        :dance-id="danceId"
        :label="dance.shortName || dance.name"
        :steps="dance.steps"
      />
    </div>
  </div>
</template>
