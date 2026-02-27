<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import ScheduleGrid from '@/components/ScheduleGrid.vue'
import ScheduleSidebar from '@/components/ScheduleSidebar.vue'

const store = useCompetitionStore()

const blockEntries = computed(() => Object.entries(store.blocks))
const activeBlockId = ref(blockEntries.value[0]?.[0] ?? '')
const activeBlock = computed(() => store.blocks[activeBlockId.value])
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Block tabs -->
    <div class="flex gap-1 border-b border-gray-200 bg-white px-4">
      <button
        v-for="[blockId, block] in blockEntries"
        :key="blockId"
        class="border-b-2 px-4 py-2 text-sm font-medium transition-colors"
        :class="
          activeBlockId === blockId
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        "
        @click="activeBlockId = blockId"
      >
        {{ block.name }}
      </button>
    </div>

    <!-- Main area: sidebar + grid -->
    <div class="flex flex-1 overflow-hidden">
      <ScheduleSidebar />
      <div class="flex-1 overflow-auto p-4">
        <ScheduleGrid v-if="activeBlock" :block="activeBlock" :block-id="activeBlockId" />
        <div v-else class="py-12 text-center text-gray-400">No block selected</div>
      </div>
    </div>
  </div>
</template>
