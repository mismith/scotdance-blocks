<script setup lang="ts">
import GroupPalette from '@/components/GroupPalette.vue'
import JudgePalette from '@/components/JudgePalette.vue'
</script>

<template>
  <aside class="flex w-56 flex-col gap-4 overflow-y-auto border-r border-gray-200 bg-gray-50 p-3">
    <GroupPalette />
    <JudgePalette />
  </aside>
</template>
