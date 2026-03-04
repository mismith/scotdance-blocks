<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { makeAutoScroll, makeDroppable } from '@vue-dnd-kit/core'
import { useScroll } from '@vueuse/core'
import { computed, ref, ref as vueRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'

import { useAutoFill } from '@/composables/useAutoFill'
import { useDragType } from '@/composables/useDragType'
import AddPopover from '@/components/AddPopover.vue'
import BlockSection from '@/components/BlockSection.vue'
import DragIndicator from '@/components/DragIndicator.vue'
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
}

function onRemoveBlock(blockId: string) {
  const block = store.blocks[blockId]
  const hasEvents = block?.events && Object.keys(block.events).length > 0
  if (hasEvents && !confirm('Remove this block and all its events?')) return
  store.removeBlock(blockId)
}

// --- Empty state setup steps ---
const route = useRoute()
const router = useRouter()
const isDemo = computed(() => route.path.startsWith('/demo'))

const hasPlatforms = computed(() => store.platformEntries.length > 0)
const hasDances = computed(() => Object.keys(store.dances).length > 0)
const hasGroups = computed(() => Object.keys(store.groups).length > 0)
const hasDanceGroups = computed(() =>
  Object.values(store.dances).some((d) => Object.keys(d.groupIds).length > 0),
)
const hasJudges = computed(() => Object.values(store.staff).some((m) => m.type === 'Judge'))

function clickSidebarButton(selector: string) {
  const btn = document.querySelector<HTMLElement>(selector)
  if (btn) {
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    btn.click()
  }
}

function onAddPlatformFromEmpty() {
  autoEditPlatformId.value = store.addPlatform()
}

function onConfigureDanceGroups() {
  router.push({ name: isDemo.value ? 'demo-dance-groups' : 'dance-groups' })
}
</script>

<template>
  <div class="flex h-full flex-col overflow-clip bg-background">
    <div class="relative flex-1 overflow-clip">
    <div ref="scrollEl" class="absolute inset-0 overflow-auto pb-4">
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
          class="sticky top-0 z-20 col-span-full grid grid-cols-subgrid gap-2 pt-4 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-bottom-4 before:-z-10 before:bg-linear-to-b before:from-background before:to-transparent before:backdrop-blur-md before:mask-[linear-gradient(to_bottom,black_33%,transparent)]"
          :class="blockEntries.length > 0 ? 'pb-4' : 'pb-2'"
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
            class="absolute! top-0 bottom-0"
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
              class="mb-4"
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
                class="flex items-center gap-1 outline-none hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring rounded"
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
              placeholder="Search blocks..."
              @close="showBlockPopover = false"
              @select="onAddBlock($event.label)"
              @add="onAddBlock($event)"
            />
          </div>
        </template>
      </div>

      <!-- Empty state: readonly (no blocks) -->
      <div
        v-if="blockEntries.length === 0 && store.collectionsReadonly"
        class="flex flex-col items-center justify-center gap-3 px-4 py-16"
      >
        <h2 class="mb-1 text-lg font-semibold text-foreground">Build your schedule</h2>
        <p class="mb-2 max-w-sm text-center text-sm text-muted-foreground">
          Create a block to start scheduling
        </p>
        <button
          class="flex w-full max-w-xs items-center gap-3 rounded-xl bg-accent/10 px-4 py-3 text-left outline-none glass glass-accent hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring"
          @click="showBlockPopover = true"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/30 text-sm font-bold text-accent-foreground dark:text-accent"
            >+</span
          >
          <div class="min-w-0">
            <div class="text-sm font-medium text-accent-foreground dark:text-accent/80">
              Create a block
            </div>
            <div class="text-xs text-accent-foreground/60 dark:text-accent/50">
              Start building your schedule
            </div>
          </div>
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

      <!-- Empty state: editable setup (persists until a block is added) -->
      <div
        v-if="blockEntries.length === 0 && !store.collectionsReadonly"
        class="flex flex-col items-center justify-center gap-3 px-4 py-16"
      >
        <h2 class="mb-1 text-lg font-semibold text-foreground">Build your schedule</h2>
        <p class="mb-4 max-w-sm text-center text-sm text-muted-foreground">
          Set up your competition in a few steps
        </p>

        <!-- Step 1: Platforms -->
        <button
          class="flex w-full max-w-xs items-center gap-3 rounded-xl px-4 py-3 text-left outline-none glass glass-card focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasPlatforms ? 'bg-muted/30' : 'bg-muted/50 hover:bg-muted/80'"
          @click="onAddPlatformFromEmpty"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasPlatforms ? 'bg-muted text-muted-foreground/60' : 'bg-muted text-muted-foreground'
            "
          >
            <svg v-if="hasPlatforms" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>1</template>
          </span>
          <div class="min-w-0">
            <div class="text-sm font-medium text-foreground" :class="hasPlatforms && 'opacity-60'">
              Add platforms
            </div>
            <div class="text-xs text-muted-foreground" :class="hasPlatforms && 'opacity-60'">
              Set up stages or areas for dancing
            </div>
          </div>
        </button>

        <!-- Step 2: Dances -->
        <button
          class="flex w-full max-w-xs items-center gap-3 rounded-xl px-4 py-3 text-left outline-none glass glass-dance focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasDances ? 'bg-dance/5' : 'bg-dance/10 hover:bg-dance/20'"
          @click="clickSidebarButton('[data-add=dance]')"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasDances
                ? 'bg-dance/20 text-dance-foreground/60 dark:text-dance/40'
                : 'bg-dance/30 text-dance-foreground dark:text-dance'
            "
          >
            <svg v-if="hasDances" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>2</template>
          </span>
          <div class="min-w-0">
            <div
              class="text-sm font-medium text-dance-foreground dark:text-dance/80"
              :class="hasDances && 'opacity-60'"
            >
              Add dances
            </div>
            <div
              class="text-xs text-dance-foreground/60 dark:text-dance/50"
              :class="hasDances && 'opacity-60'"
            >
              Define the dances for your competition
            </div>
          </div>
        </button>

        <!-- Step 3: Groups -->
        <button
          class="flex w-full max-w-xs items-center gap-3 rounded-xl px-4 py-3 text-left outline-none glass glass-group focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasGroups ? 'bg-group/5' : 'bg-group/10 hover:bg-group/20'"
          @click="
            clickSidebarButton(
              Object.keys(store.categories).length > 0 ? '[data-add=group]' : '[data-add=category]',
            )
          "
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasGroups
                ? 'bg-group/20 text-group-foreground/60 dark:text-group/40'
                : 'bg-group/30 text-group-foreground dark:text-group'
            "
          >
            <svg v-if="hasGroups" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>3</template>
          </span>
          <div class="min-w-0">
            <div
              class="text-sm font-medium text-group-foreground dark:text-group/80"
              :class="hasGroups && 'opacity-60'"
            >
              Add categories &amp; groups
            </div>
            <div
              class="text-xs text-group-foreground/60 dark:text-group/50"
              :class="hasGroups && 'opacity-60'"
            >
              Set up age categories and groups
            </div>
          </div>
        </button>

        <!-- Step 4: Configure dance groups (appears when both dances and groups exist) -->
        <button
          v-if="hasDances && hasGroups"
          class="flex w-full max-w-xs items-center gap-3 rounded-xl px-4 py-3 text-left outline-none glass glass-dance focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasDanceGroups ? 'bg-dance/5' : 'bg-dance/10 hover:bg-dance/20'"
          @click="onConfigureDanceGroups"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasDanceGroups
                ? 'bg-dance/20 text-dance-foreground/60 dark:text-dance/40'
                : 'bg-dance/30 text-dance-foreground dark:text-dance'
            "
          >
            <svg v-if="hasDanceGroups" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>4</template>
          </span>
          <div class="min-w-0">
            <div
              class="text-sm font-medium text-dance-foreground dark:text-dance/80"
              :class="hasDanceGroups && 'opacity-60'"
            >
              Configure dance groups
            </div>
            <div
              class="text-xs text-dance-foreground/60 dark:text-dance/50"
              :class="hasDanceGroups && 'opacity-60'"
            >
              Choose which groups dance which dances
            </div>
          </div>
        </button>

        <!-- Step 5: Judges -->
        <button
          class="flex w-full max-w-xs items-center gap-3 rounded-xl px-4 py-3 text-left outline-none glass glass-judge focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasJudges ? 'bg-judge/5' : 'bg-judge/10 hover:bg-judge/20'"
          @click="clickSidebarButton('[data-add=judge]')"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasJudges
                ? 'bg-judge/20 text-judge-foreground/60 dark:text-judge/40'
                : 'bg-judge/30 text-judge-foreground dark:text-judge'
            "
          >
            <svg v-if="hasJudges" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>5</template>
          </span>
          <div class="min-w-0">
            <div
              class="text-sm font-medium text-judge-foreground dark:text-judge/80"
              :class="hasJudges && 'opacity-60'"
            >
              Add judges
            </div>
            <div
              class="text-xs text-judge-foreground/60 dark:text-judge/50"
              :class="hasJudges && 'opacity-60'"
            >
              Add your competition judges
            </div>
          </div>
        </button>

        <!-- Step 6: Create block -->
        <button
          ref="addBlockBtnEl"
          class="flex w-full max-w-xs items-center gap-3 rounded-xl bg-accent/20 dark:bg-muted px-4 py-3 text-left outline-none glass glass-accent hover:bg-accent/30 dark:hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring"
          @click="showBlockPopover = true"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/40 dark:bg-accent text-sm font-bold text-accent-foreground dark:text-accent-foreground"
            >6</span
          >
          <div class="min-w-0">
            <div class="text-sm font-medium text-accent-foreground dark:text-foreground">
              Create a block
            </div>
            <div class="text-xs text-accent-foreground/60 dark:text-muted-foreground">
              Start building your schedule
            </div>
          </div>
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
    </div>
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 transition-opacity"
      :class="arrivedState.bottom ? 'opacity-0' : 'opacity-100'"
    >
      <div
        class="h-full bg-linear-to-t from-background to-transparent backdrop-blur-md mask-[linear-gradient(to_top,black_33%,transparent)]"
      />
    </div>
    </div>
  </div>
</template>
