<script setup lang="ts">
import { useRoute } from 'vue-router'

import DancePalette from '@/components/DancePalette.vue'
import GroupPalette from '@/components/GroupPalette.vue'
import JudgePalette from '@/components/JudgePalette.vue'

const route = useRoute()
</script>

<template>
  <aside class="flex w-64 flex-col gap-4 overflow-y-auto border-r border-border bg-muted p-3">
    <DancePalette />
    <GroupPalette />
    <JudgePalette v-if="route.name !== 'dance-groups'" />
  </aside>
</template>
