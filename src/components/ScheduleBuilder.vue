<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useAutoFill } from '@/composables/useAutoFill'
import { useDragType } from '@/composables/useDragType'
import AddPopover from '@/components/AddPopover.vue'
import BlockTab from '@/components/BlockTab.vue'
import DragIndicator from '@/components/DragIndicator.vue'
import ScheduleGrid from '@/components/ScheduleGrid.vue'
import { BLOCK_PRESETS } from '@/data/presets'
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

const autoFillBtnEl = vueRef<HTMLElement | null>(null)
const autoFillMenuEl = vueRef<HTMLElement | null>(null)
const { floatingStyles: autoFillMenuStyle } = useFloating(autoFillBtnEl, autoFillMenuEl, {
  placement: 'bottom-end',
  middleware: [offset(4), flip(), shift()],
  whileElementsMounted: autoUpdate,
})

const autoEditBlockId = ref<string | null>(null)

// --- Block add popover ---
const showBlockPopover = ref(false)
const addBlockBtnEl = ref<HTMLElement | null>(null)

const blockPopoverItems = computed(() => {
  const existingNames = new Set(Object.values(store.blocks).map((b) => b.name))
  return BLOCK_PRESETS.filter((name) => !existingNames.has(name)).map((name) => ({
    key: name,
    label: name,
  }))
})

function onAddBlock(name: string) {
  const id = store.addBlock(name)
  activeBlockId.value = id
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

// --- Autofill schedule ---
const { autoFillSchedule } = useAutoFill()
const showAutoFillMenu = ref(false)

function onAutoFillSchedule() {
  const hasContent = blockEntries.value.some(([, block]) => Object.keys(block.events).length > 0)
  if (hasContent && !confirm('This will replace the current schedule. Continue?')) return
  const firstBlockId = autoFillSchedule()
  if (firstBlockId) activeBlockId.value = firstBlockId
  showAutoFillMenu.value = false
}
</script>

<template>
  <div class="flex h-full flex-col overflow-clip bg-card">
    <!-- Block tabs -->
    <div
      ref="tabBarEl"
      class="flex gap-1 overflow-x-auto bg-background px-4 pt-2"
      :class="isValidTarget ? 'bg-group-muted' : ''"
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
      <div class="-mb-0.5">
        <button
          ref="addBlockBtnEl"
          class="inline-flex gap-1 rounded-t-lg px-3 py-2.5 text-sm font-medium text-muted-foreground outline-none glass glass-muted backdrop-blur-3xl hover:bg-muted hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          title="Add block"
          @click="showBlockPopover = !showBlockPopover"
        >
          + <span v-if="blockEntries.length === 0">Add block</span>
        </button>
        <AddPopover
          :anchor="addBlockBtnEl"
          :open="showBlockPopover"
          :items="blockPopoverItems"
          placeholder="Search blocks..."
          @close="showBlockPopover = false"
          @select="onAddBlock($event.label)"
          @add="onAddBlock($event)"
        />
      </div>
      <div
        v-if="Object.keys(store.dances).length > 0 || Object.keys(store.categories).length > 0"
        class="ml-auto self-center"
      >
        <button
          ref="autoFillBtnEl"
          class="rainbow-rounded rainbow-border flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          title="Boost"
          @click="showAutoFillMenu = !showAutoFillMenu"
        >
          <svg class="size-3 rainbow-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.94 1.5a.5.5 0 0 1 .44.74L7.26 6H12a.5.5 0 0 1 .4.8l-5.5 7a.5.5 0 0 1-.9-.54L8.12 10H4a.5.5 0 0 1-.4-.8l5-7a.5.5 0 0 1 .34-.2Z" />
          </svg>
          Boost
          <svg class="size-3 opacity-50" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <Teleport to="body">
          <div
            v-if="showAutoFillMenu"
            class="fixed inset-0 z-40"
            @click="showAutoFillMenu = false"
          />
          <div
            v-if="showAutoFillMenu"
            ref="autoFillMenuEl"
            class="z-50 min-w-48 rounded-lg border border-border bg-card p-1 shadow-lg"
            :style="autoFillMenuStyle"
          >
            <button
              class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              @click="onAutoFillSchedule"
            >
              Boost schedule
            </button>
          </div>
        </Teleport>
      </div>
    </div>

    <!-- Grid -->
    <div class="flex-1 overflow-auto py-4">
      <div class="w-fit min-w-full px-4">
        <ScheduleGrid v-if="activeBlock" :block="activeBlock" :block-id="activeBlockId" />
        <div v-else class="py-12 text-center text-muted-foreground">
          <template v-if="Object.keys(store.dances).length === 0 && Object.keys(store.groups).length === 0">
            Add dances and groups in the sidebar, then create your first block here.
          </template>
          <template v-else>
            Click + to add your first block.
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
