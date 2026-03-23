<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { makeAutoScroll, makeDroppable } from '@vue-dnd-kit/core'
import { useScroll } from '@vueuse/core'
import { computed, nextTick, ref, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useAutoFill } from '@/composables/useAutoFill'
import { useDragType } from '@/composables/useDragType'
import AddPopover from '@/components/AddPopover.vue'
import BlockSection from '@/components/BlockSection.vue'
import DragIndicator from '@/components/DragIndicator.vue'
import EmptyStateWizard from '@/components/EmptyStateWizard.vue'
import PlatformHeader from '@/components/PlatformHeader.vue'
import { BLOCK_PRESETS } from '@/data/presets'
import type { DragBlockData, DragPlatformData } from '@/types'

const store = useCompetitionStore()
const { provider, activeDragGroup } = useDragType()

const blockEntries = computed(() => Object.entries(store.blocks))

const scrollEl = ref<HTMLElement | null>(null)
makeAutoScroll(scrollEl)
const { arrivedState } = useScroll(scrollEl, { offset: { bottom: 5 } })

const gridEl = ref<HTMLElement | null>(null)
const headerRowEl = vueRef<HTMLElement | null>(null)

const gridCols = computed(() => {
  const platformCols = `repeat(${store.platformEntries.length}, minmax(14rem, 1fr))`
  if (blockEntries.value.length === 0) {
    return `${platformCols} minmax(2rem, auto)`
  }
  return `minmax(10rem, auto) ${platformCols} minmax(2rem, auto)`
})

// --- Block reorder (vertical) ---

function getBlockInsertIndex(pointerY: number): number | undefined {
  if (!gridEl.value) return undefined
  const sections = gridEl.value.querySelectorAll('[data-block-section]')
  if (!sections.length) return undefined
  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) return i
  }
  return sections.length
}

makeDroppable(gridEl, {
  groups: ['block'],
  events: {
    onDrop(event) {
      const dragData = event.payload?.items[0] as DragBlockData | undefined
      if (!dragData) return

      const pointerY = event.provider.pointer.value?.current.y ?? 0
      const insertIndex = getBlockInsertIndex(pointerY)

      if (insertIndex !== undefined) {
        store.reorderBlock(
          dragData.index,
          insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
        )
      }
    },
  },
})

const isBlockDragging = computed(() => activeDragGroup.value === 'block')

const liveBlockInsertIndex = computed(() => {
  if (!isBlockDragging.value) return -1
  const pointerY = provider.pointer.value?.current.y
  if (pointerY === undefined) return -1
  return getBlockInsertIndex(pointerY) ?? -1
})

// --- Platform reorder (horizontal) ---

function getPlatformInsertIndex(pointerX: number): number | undefined {
  if (!headerRowEl.value) return undefined
  const headers = headerRowEl.value.querySelectorAll('[data-platform-header]')
  if (!headers.length) return undefined
  for (let i = 0; i < headers.length; i++) {
    const rect = headers[i].getBoundingClientRect()
    if (pointerX < rect.left + rect.width / 2) return i
  }
  return headers.length
}

const { isDragOver: isPlatformDragOver } = makeDroppable(headerRowEl, {
  groups: ['platform'],
  events: {
    onDrop(event) {
      if (store.collectionsReadonly) return
      const dragData = event.payload?.items[0] as DragPlatformData | undefined
      if (!dragData) return

      const pointerX = event.provider.pointer.value?.current.x ?? 0
      const insertIndex = getPlatformInsertIndex(pointerX)

      if (insertIndex !== undefined) {
        store.reorderPlatform(
          dragData.index,
          insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
        )
      }
    },
  },
})

const livePlatformInsertIndex = computed(() => {
  if (!isPlatformDragOver.value) return -1
  const pointerX = provider.pointer.value?.current.x
  if (pointerX === undefined) return -1
  return getPlatformInsertIndex(pointerX) ?? -1
})

const indicatorLeftPx = computed(() => {
  if (!isPlatformDragOver.value || !headerRowEl.value) return 0
  const idx = livePlatformInsertIndex.value
  if (idx < 0) return 0
  const headers = headerRowEl.value.querySelectorAll('[data-platform-header]')
  const containerRect = headerRowEl.value.getBoundingClientRect()
  if (idx < headers.length) {
    return headers[idx].getBoundingClientRect().left - containerRect.left
  }
  if (headers.length > 0) {
    return headers[headers.length - 1].getBoundingClientRect().right - containerRect.left
  }
  return 0
})

const autoEditPlatformId = ref<string | null>(null)

function onAddPlatform() {
  autoEditPlatformId.value = store.addPlatform()
}

function onRemovePlatform(platformId: string) {
  const hasAssignments = Object.values(store.blocks).some((block) =>
    Object.values(block.events).some((event) =>
      Object.values(event.dances ?? {}).some((sd) => {
        const a = sd.platforms[platformId]
        return a && (a.orderedGroupIds.length > 0 || a.orderedJudgeIds.length > 0)
      }),
    ),
  )
  if (hasAssignments && !confirm('Remove this platform? It has assignments.')) return
  store.removePlatform(platformId)
}

// --- Autofill schedule ---
const autoFillBtnEl = vueRef<HTMLElement | null>(null)
const autoFillMenuEl = vueRef<HTMLElement | null>(null)
const { floatingStyles: autoFillMenuStyle } = useFloating(autoFillBtnEl, autoFillMenuEl, {
  placement: 'bottom-end',
  middleware: [offset(4), flip(), shift()],
  whileElementsMounted: autoUpdate,
})

const { autoFillSchedule } = useAutoFill()
const showAutoFillMenu = ref(false)

function onAutoFillSchedule() {
  const hasContent = blockEntries.value.some(([, block]) => Object.keys(block.events).length > 0)
  if (hasContent && !confirm('This will replace the current schedule. Continue?')) return
  autoFillSchedule()
  showAutoFillMenu.value = false
}

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
  store.addBlock(name)
  nextTick(() => {
    const sections = document.querySelectorAll('[data-block-section]')
    sections.item(sections.length - 1)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function onRemoveBlock(blockId: string) {
  const block = store.blocks[blockId]
  const hasEvents = block?.events && Object.keys(block.events).length > 0
  if (hasEvents && !confirm('Remove this block and all its events?')) return
  store.removeBlock(blockId)
}

// --- Empty state setup steps ---
function onAddPlatformFromEmpty() {
  autoEditPlatformId.value = store.addPlatform()
}
</script>

<template>
  <div class="flex h-full flex-col overflow-clip bg-background">
    <div class="relative flex-1 overflow-clip">
      <div
        ref="scrollEl"
        class="absolute inset-0 overflow-auto pb-12"
        :class="{ 'scroll-fade-b-16': !arrivedState.bottom }"
      >
        <!-- Platform headers grid (shown when platforms exist) -->
        <div
          v-if="store.platformEntries.length > 0 || blockEntries.length > 0"
          ref="gridEl"
          class="w-fit min-w-full px-4 text-sm"
          :style="{
            display: 'grid',
            gridTemplateColumns: gridCols,
            minWidth: `max(100%, ${store.platformEntries.length * 12}rem)`,
          }"
        >
          <!-- Platform headers (top-level, shared across all blocks) -->
          <div
            ref="headerRowEl"
            class="sticky top-0 z-20 col-span-full grid grid-cols-subgrid gap-2 py-4 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-bottom-4 before:-z-10 before:bg-linear-to-b before:from-background before:to-transparent before:backdrop-blur-md before:mask-[linear-gradient(to_bottom,black_33%,transparent)]"
          >
            <div v-if="blockEntries.length > 0" class="px-1 py-1.5" />
            <PlatformHeader
              v-for="([platformId, platform], platformIndex) in store.platformEntries"
              :key="platformId"
              :platform="platform"
              :platform-id="platformId"
              :index="platformIndex"
              :auto-edit="autoEditPlatformId === platformId"
              :readonly="store.collectionsReadonly"
              @remove="onRemovePlatform(platformId)"
            />
            <button
              :tabindex="store.collectionsReadonly ? -1 : 0"
              class="flex items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-card px-2 py-1.5 text-sm font-semibold text-muted-foreground outline-none glass glass-card hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              :class="[store.collectionsReadonly && 'invisible pointer-events-none']"
              title="Add platform"
              @click="onAddPlatform"
            >
              + <span v-if="store.platformEntries.length === 0">Add platform</span>
            </button>
            <!-- Platform insertion indicator (absolute, no layout impact) -->
            <DragIndicator
              v-if="isPlatformDragOver && livePlatformInsertIndex >= 0"
              orientation="vertical"
              class="absolute! top-4 bottom-4"
              :style="{ left: indicatorLeftPx + 'px' }"
            />
          </div>

          <!-- Block cards (only when blocks exist) -->
          <template v-if="blockEntries.length > 0">
            <template v-for="([blockId, block], blockIndex) in blockEntries" :key="blockId">
              <DragIndicator
                v-if="isBlockDragging && liveBlockInsertIndex === blockIndex"
                class="col-span-full -my-px"
              />
              <BlockSection
                :block="block"
                :block-id="blockId"
                :index="blockIndex"
                class="mb-12"
                @remove="onRemoveBlock(blockId)"
              />
            </template>
            <DragIndicator
              v-if="isBlockDragging && liveBlockInsertIndex === blockEntries.length"
              class="col-span-full -my-px"
            />

            <!-- Add block row (full-width, like event header) -->
            <div class="col-span-full">
              <div
                ref="addBlockBtnEl"
                class="flex min-h-9 items-center gap-1 rounded-xl px-4 py-3 text-left text-sm font-medium text-muted-foreground glass glass-muted"
              >
                <button
                  class="flex flex-1 items-center gap-1 outline-none hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                  title="Add block"
                  @click="showBlockPopover = !showBlockPopover"
                >
                  <span class="select-none">+</span>
                  Add block
                </button>
                <div
                  v-if="
                    Object.keys(store.dances).length > 0 || Object.keys(store.categories).length > 0
                  "
                  class="ml-auto"
                  @click.stop
                >
                  <button
                    ref="autoFillBtnEl"
                    class="rainbow-rounded rainbow-border -my-0.5 flex items-center gap-0.5 rounded border border-border bg-card px-1 py-1 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    title="Autofill"
                    @click="showAutoFillMenu = !showAutoFillMenu"
                  >
                    <svg class="size-3 rainbow-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path
                        d="M8.94 1.5a.5.5 0 0 1 .44.74L7.26 6H12a.5.5 0 0 1 .4.8l-5.5 7a.5.5 0 0 1-.9-.54L8.12 10H4a.5.5 0 0 1-.4-.8l5-7a.5.5 0 0 1 .34-.2Z"
                      />
                    </svg>
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
                        Autofill schedule
                      </button>
                    </div>
                  </Teleport>
                </div>
              </div>
              <AddPopover
                :anchor="addBlockBtnEl"
                :open="showBlockPopover"
                :items="blockPopoverItems"
                placeholder="Type new block name..."
                popover-class="text-muted-foreground glass glass-muted"
                @close="showBlockPopover = false"
                @select="onAddBlock($event.label)"
                @add="onAddBlock($event)"
              />
            </div>
          </template>
        </div>

        <!-- Empty state: setup wizard (persists until a block is added) -->
        <EmptyStateWizard
          v-if="blockEntries.length === 0"
          @add-platform="onAddPlatformFromEmpty"
          @add-block="onAddBlock($event)"
          @auto-fill="onAutoFillSchedule"
        />
      </div>
    </div>
  </div>
</template>
