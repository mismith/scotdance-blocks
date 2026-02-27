<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import InlineEdit from '@/components/InlineEdit.vue'
import ScheduleGrid from '@/components/ScheduleGrid.vue'
import ScheduleSidebar from '@/components/ScheduleSidebar.vue'

const store = useCompetitionStore()

const blockEntries = computed(() => Object.entries(store.blocks))
const activeBlockId = ref(blockEntries.value[0]?.[0] ?? '')
const activeBlock = computed(() => store.blocks[activeBlockId.value])

function onAddBlock() {
  const id = store.addBlock()
  activeBlockId.value = id
}

function onRemoveBlock(blockId: string) {
  if (!confirm('Remove this block and all its events?')) return
  store.removeBlock(blockId)
  if (activeBlockId.value === blockId) {
    activeBlockId.value = blockEntries.value[0]?.[0] ?? ''
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Block tabs -->
    <div class="flex items-center gap-1 border-b border-gray-200 bg-white px-4">
      <div
        v-for="[blockId, block] in blockEntries"
        :key="blockId"
        class="group flex items-center gap-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors"
        :class="
          activeBlockId === blockId
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        "
        role="button"
        @click="activeBlockId = blockId"
      >
        <InlineEdit
          :model-value="block.name"
          placeholder="Block name"
          @update:model-value="store.renameBlock(blockId, $event)"
        />
        <button
          class="ml-1 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          title="Remove block"
          @click.stop="onRemoveBlock(blockId)"
        >
          &times;
        </button>
      </div>
      <button
        class="border-b-2 border-transparent px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
        title="Add block"
        @click="onAddBlock"
      >
        +
      </button>
    </div>

    <!-- Main area: sidebar + grid -->
    <div class="flex flex-1 overflow-hidden">
      <ScheduleSidebar />
      <div class="flex-1 overflow-auto p-4">
        <ScheduleGrid v-if="activeBlock" :block="activeBlock" :block-id="activeBlockId" />
        <div v-else class="py-12 text-center text-gray-400">
          No block selected. Click + to add one.
        </div>
      </div>
    </div>
  </div>
</template>
