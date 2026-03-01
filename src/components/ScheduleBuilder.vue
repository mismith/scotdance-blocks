<script setup lang="ts">
import { makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import BlockTab from '@/components/BlockTab.vue'
import DragIndicator from '@/components/DragIndicator.vue'
import ScheduleGrid from '@/components/ScheduleGrid.vue'
import ScheduleSidebar from '@/components/ScheduleSidebar.vue'
import type { DragBlockData } from '@/types'

const store = useCompetitionStore()
const { provider, activeDragGroup } = useDragType()

const isValidTarget = computed(() => activeDragGroup.value === 'block')

const blockEntries = computed(() => Object.entries(store.blocks))
const activeBlockId = ref(blockEntries.value[0]?.[0] ?? '')
const activeBlock = computed(() => store.blocks[activeBlockId.value])

const tabBarEl = vueRef<HTMLElement | null>(null)

function getTabInsertIndex(pointerX: number): number | undefined {
  if (!tabBarEl.value) return undefined
  const tabs = tabBarEl.value.querySelectorAll('[data-block-tab]')
  if (!tabs.length) return undefined
  for (let i = 0; i < tabs.length; i++) {
    const rect = tabs[i].getBoundingClientRect()
    if (pointerX < rect.left + rect.width / 2) return i
  }
  return tabs.length
}

const { isDragOver } = makeDroppable(tabBarEl, {
  groups: ['block'],
  events: {
    onDrop(event) {
      const dragData = event.payload?.items[0] as DragBlockData | undefined
      if (!dragData) return

      const pointerX = event.provider.pointer.value?.current.x ?? 0
      const insertIndex = getTabInsertIndex(pointerX)

      if (insertIndex !== undefined) {
        store.reorderBlock(
          dragData.index,
          insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
        )
      }
    },
  },
})

const liveBlockInsertIndex = computed(() => {
  if (!isDragOver.value) return -1
  const pointerX = provider.pointer.value?.current.x
  if (pointerX === undefined) return -1
  return getTabInsertIndex(pointerX) ?? -1
})

const autoEditBlockId = ref<string | null>(null)

function onAddBlock() {
  const id = store.addBlock()
  activeBlockId.value = id
  autoEditBlockId.value = id
}

function onRemoveBlock(blockId: string) {
  const block = store.blocks[blockId]
  const hasEvents = block?.events && Object.keys(block.events).length > 0
  if (hasEvents && !confirm('Remove this block and all its events?')) return
  store.removeBlock(blockId)
  if (activeBlockId.value === blockId) {
    activeBlockId.value = blockEntries.value[0]?.[0] ?? ''
  }
}
</script>

<template>
  <div class="flex h-full">
    <ScheduleSidebar />

    <div class="flex flex-1 flex-col overflow-clip">
      <!-- Block tabs -->
      <div
        ref="tabBarEl"
        class="flex gap-1 border-b border-gray-200 bg-white px-4 pt-2"
        :class="isValidTarget ? 'bg-blue-50' : ''"
      >
        <template v-for="([blockId, block], blockIndex) in blockEntries" :key="blockId">
          <DragIndicator
            v-if="isDragOver && liveBlockInsertIndex === blockIndex"
            orientation="vertical"
            class="-mx-0.75 self-stretch rounded"
          />
          <BlockTab
            :block="block"
            :block-id="blockId"
            :index="blockIndex"
            :active="activeBlockId === blockId"
            :auto-edit="autoEditBlockId === blockId"
            @select="activeBlockId = blockId"
            class="pt-0"
            @remove="onRemoveBlock(blockId)"
          />
        </template>
        <DragIndicator
          v-if="isDragOver && liveBlockInsertIndex === blockEntries.length"
          orientation="vertical"
          class="-mx-0.75 self-stretch rounded"
        />
        <button
          class="rounded px-3 py-2 text-sm text-gray-400 outline-none hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-400"
          title="Add block"
          @click="onAddBlock"
        >
          +
        </button>
      </div>

      <!-- Grid -->
      <div class="flex-1 overflow-auto p-4">
        <ScheduleGrid v-if="activeBlock" :block="activeBlock" :block-id="activeBlockId" />
        <div v-else class="py-12 text-center text-gray-400">
          No block selected. Click + to add one.
        </div>
      </div>
    </div>
  </div>
</template>
