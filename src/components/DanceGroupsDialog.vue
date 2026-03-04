<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { useCompetitionStore } from '@/stores/competition'
import { useDanceGroupsDialog } from '@/composables/useDanceGroupsDialog'

const store = useCompetitionStore()
const { isOpen, close } = useDanceGroupsDialog()

const dialogEl = ref<HTMLDialogElement | null>(null)
const expandedCategories = reactive(new Set<string>())

watch(isOpen, (open) => {
  if (open) {
    dialogEl.value?.showModal()
  } else {
    dialogEl.value?.close()
    expandedCategories.clear()
  }
})

function onCancel(e: Event) {
  e.preventDefault()
  close()
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialogEl.value) close()
}

/**
 * Returns the tri-state for a dance × category:
 * 'all' = every group in the category has this dance
 * 'none' = no groups have it
 * 'some' = mixed
 */
function categoryDanceState(categoryId: string, danceId: string): 'all' | 'none' | 'some' {
  const catGroups = store.groupsByCategory[categoryId] ?? []
  if (catGroups.length === 0) return 'none'
  const dance = store.dances[danceId]
  if (!dance) return 'none'
  let checkedCount = 0
  for (const [gId] of catGroups) {
    if (dance.groupIds[gId]) checkedCount++
  }
  if (checkedCount === 0) return 'none'
  if (checkedCount === catGroups.length) return 'all'
  return 'some'
}

const danceEntries = computed(() => Object.entries(store.dances))
const categoryEntries = computed(() => Object.entries(store.categories))

const gridCols = computed(() => `auto repeat(${danceEntries.value.length}, auto)`)
</script>

<template>
  <dialog
    ref="dialogEl"
    class="m-auto max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-lg backdrop:bg-background/60 backdrop:backdrop-blur-sm sm:max-h-[calc(100%-4rem)] sm:max-w-[calc(100%-4rem)] lg:max-h-[calc(100%-6rem)] lg:max-w-[calc(100%-6rem)] open:flex"
    @cancel="onCancel"
    @click="onBackdropClick"
  >
    <!-- Header bar -->
    <div class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
      <h2 class="text-sm font-semibold text-foreground">Dance Groups</h2>
      <button
        class="flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        title="Close"
        @click="close"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
          />
        </svg>
      </button>
    </div>
    <!-- Scrollable matrix body -->
    <div class="flex-1 overflow-auto p-4">
      <div class="w-fit min-w-full overflow-hidden rounded-xl border border-border">
        <div class="text-sm" :style="{ display: 'grid', gridTemplateColumns: gridCols }">
          <!-- Header row -->
          <div
            class="sticky left-0 z-10 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
          >
            Category / Group
          </div>
          <div
            v-for="[danceId, dance] in danceEntries"
            :key="danceId"
            class="px-3 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap"
          >
            {{ dance.shortName || dance.name
            }}<template v-if="dance.steps"> ({{ dance.steps }})</template>
          </div>

          <template v-for="[categoryId, category] in categoryEntries" :key="categoryId">
            <!-- Category row -->
            <div class="sticky left-0 z-10 bg-muted/50 px-3 py-2 font-medium text-foreground">
              <details
                v-if="(store.groupsByCategory[categoryId]?.length ?? 0) > 1"
                :open="expandedCategories.has(categoryId) || undefined"
                @toggle="
                  (e: Event) => {
                    ;(e.target as HTMLDetailsElement).open
                      ? expandedCategories.add(categoryId)
                      : expandedCategories.delete(categoryId)
                  }
                "
              >
                <summary
                  class="cursor-default whitespace-nowrap rounded outline-none select-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {{ category.name }}
                </summary>
              </details>
              <span v-else class="ml-[1.2em]">{{ category.name }}</span>
            </div>
            <div
              v-for="[danceId] in danceEntries"
              :key="danceId"
              class="bg-muted/50 px-3 py-2 text-center"
            >
              <input
                type="checkbox"
                class="size-4 cursor-default accent-dance"
                :class="store.collectionsReadonly ? 'pointer-events-none opacity-60' : ''"
                :checked="categoryDanceState(categoryId, danceId) === 'all'"
                :indeterminate="categoryDanceState(categoryId, danceId) === 'some'"
                @change="store.toggleDanceCategoryGroups(danceId, categoryId)"
              />
            </div>

            <!-- Individual group sub-rows (when expanded) -->
            <template v-if="expandedCategories.has(categoryId)">
              <template
                v-for="[groupId, group] in store.groupsByCategory[categoryId] ?? []"
                :key="groupId"
              >
                <div class="sticky left-0 z-10 py-1.5 pl-10 pr-3 text-muted-foreground">
                  {{ group.name }}
                </div>
                <div
                  v-for="[danceId, dance] in danceEntries"
                  :key="danceId"
                  class="px-3 py-1.5 text-center"
                >
                  <input
                    type="checkbox"
                    class="size-3.5 cursor-default accent-dance"
                    :class="store.collectionsReadonly ? 'pointer-events-none opacity-60' : ''"
                    :checked="!!dance.groupIds[groupId]"
                    @change="store.toggleDanceGroup(danceId, groupId)"
                  />
                </div>
              </template>
            </template>
          </template>
        </div>
      </div>
    </div>
  </dialog>
</template>
