<script setup lang="ts">
import { computed, reactive } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

const store = useCompetitionStore()

const expandedCategories = reactive(new Set<string>())

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

const gridCols = computed(
  () => `auto repeat(${danceEntries.value.length}, auto)`,
)
</script>

<template>
  <main class="h-full overflow-auto bg-card">
    <div class="w-fit min-w-full">
    <div
      class="text-sm"
      :style="{ display: 'grid', gridTemplateColumns: gridCols }"
    >
      <!-- Header row -->
      <div
        class="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
        <div class="sticky left-0 z-10 bg-muted px-3 py-2 font-semibold text-foreground">
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
          class="bg-muted px-3 py-2 text-center"
        >
          <input
            type="checkbox"
            class="size-4 cursor-default accent-dance-foreground"
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
            <div class="sticky left-0 z-10 bg-card py-1.5 pl-10 pr-3 text-muted-foreground">
              {{ group.name }}
            </div>
            <div
              v-for="[danceId, dance] in danceEntries"
              :key="danceId"
              class="px-3 py-1.5 text-center"
            >
              <input
                type="checkbox"
                class="size-3.5 cursor-default accent-dance-foreground"
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
  </main>
</template>
