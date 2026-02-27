<script setup lang="ts">
import { useCompetitionStore } from '@/stores/competition'

import GroupChip from '@/components/GroupChip.vue'

const store = useCompetitionStore()
</script>

<template>
  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Groups</h3>
    <div
      v-for="[categoryId, categoryGroups] in Object.entries(store.groupsByCategory)"
      :key="categoryId"
      class="mb-2"
    >
      <div class="mb-1 text-xs font-medium text-gray-400">
        {{ store.getCategoryName(categoryId) }}
      </div>
      <div class="flex flex-col gap-1">
        <GroupChip
          v-for="[groupId] in categoryGroups"
          :key="groupId"
          :group-id="groupId"
          :label="store.getGroupLabel(groupId)"
        />
      </div>
    </div>
  </div>
</template>
