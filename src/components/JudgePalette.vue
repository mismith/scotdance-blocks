<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import JudgeChip from '@/components/JudgeChip.vue'

const store = useCompetitionStore()
</script>

<template>
  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Judges</h3>
    <div class="flex flex-col gap-1">
      <JudgeChip
        v-for="[staffId] in Object.entries(store.staff)"
        :key="staffId"
        :judge-id="staffId"
        :label="store.getStaffName(staffId)"
      />
    </div>
  </div>
</template>
