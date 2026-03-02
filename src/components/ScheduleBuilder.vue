<script setup lang="ts">
import { makeDroppable } from '@vue-dnd-kit/core'
import { useElementBounding } from '@vueuse/core'
import { computed, ref, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useAutoFill } from '@/composables/useAutoFill'
import { useDragType } from '@/composables/useDragType'
import BlockTab from '@/components/BlockTab.vue'
import DragIndicator from '@/components/DragIndicator.vue'
import ScheduleGrid from '@/components/ScheduleGrid.vue'
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
const autoFillBtnBounds = useElementBounding(autoFillBtnEl)
const autoFillMenuStyle = computed(() => ({
  top: autoFillBtnBounds.bottom.value + 'px',
  right: (document.documentElement.clientWidth - autoFillBtnBounds.right.value) + 'px',
}))

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

// --- Autofill schedule ---
const { autoFillSchedule } = useAutoFill()
const showAutoFillMenu = ref(false)

function onAutoFillSchedule() {
  const hasContent = blockEntries.value.some(([, block]) =>
    Object.keys(block.events).length > 0,
  )
  if (hasContent && !confirm('This will replace the current schedule. Continue?')) return
  const firstBlockId = autoFillSchedule()
  if (firstBlockId) activeBlockId.value = firstBlockId
  showAutoFillMenu.value = false
}
function onAddRegistration() {
  if (!activeBlockId.value) return
  const eventId = store.addEvent(activeBlockId.value, 'Registration')
  store.updateEventDescription(activeBlockId.value, eventId, '9:00 AM')
  showAutoFillMenu.value = false
}
function onAddResults() {
  if (!activeBlockId.value) return
  store.addEvent(activeBlockId.value, 'Results')
  showAutoFillMenu.value = false
}
</script>

<template>
  <div class="flex h-full flex-col overflow-clip">
      <!-- Block tabs -->
      <div
        ref="tabBarEl"
        class="flex gap-1 overflow-x-auto border-b border-border bg-muted px-4 pt-2"
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
        <button
          class="rounded px-4 py-2.5 text-sm text-muted-foreground outline-none hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          title="Add block"
          @click="onAddBlock"
        >
          +
        </button>
        <div class="ml-auto self-center">
          <button
            ref="autoFillBtnEl"
            class="flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            title="Autofill"
            @click="showAutoFillMenu = !showAutoFillMenu"
          >
            Autofill
            <svg class="size-3 opacity-50" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" /></svg>
          </button>
          <Teleport to="body">
            <div
              v-if="showAutoFillMenu"
              class="fixed inset-0 z-40"
              @click="showAutoFillMenu = false"
            />
            <div
              v-if="showAutoFillMenu"
              class="fixed z-50 mt-1 min-w-48 rounded-lg border border-border bg-card p-1 shadow-lg"
              :style="autoFillMenuStyle"
            >
              <button
                class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                @click="onAutoFillSchedule"
              >
                Autofill schedule
              </button>
              <button
                class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="activeBlock ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/50 pointer-events-none'"
                :disabled="!activeBlock"
                @click="onAddRegistration"
              >
                Add Registration
              </button>
              <button
                class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="activeBlock ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/50 pointer-events-none'"
                :disabled="!activeBlock"
                @click="onAddResults"
              >
                Add Results
              </button>
            </div>
          </Teleport>
        </div>
      </div>

      <!-- Grid -->
      <div class="flex-1 overflow-auto bg-card py-4">
        <div class="w-fit min-w-full px-4">
          <ScheduleGrid v-if="activeBlock" :block="activeBlock" :block-id="activeBlockId" />
          <div v-else class="py-12 text-center text-muted-foreground">
            No block selected. Click + to add one.
          </div>
        </div>
    </div>
  </div>
</template>
