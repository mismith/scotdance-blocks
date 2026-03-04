<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'

import GroupChip from '@/components/GroupChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import SpacerChip from '@/components/SpacerChip.vue'
import { CATEGORY_PRESETS, GROUP_PRESETS } from '@/data/presets'

const store = useCompetitionStore()
const route = useRoute()

const autoEditId = ref<string | null>(null)
const autoEditCategoryId = ref<string | null>(null)
const showBoost = ref(false)

function isGroupAssigned(groupId: string) {
  return Object.values(store.blocks).some((block) =>
    Object.values(block.events).some((event) =>
      Object.values(event.dances ?? {}).some((sd) =>
        Object.values(sd.platforms).some((a) => a.orderedGroupIds.includes(groupId)),
      ),
    ),
  )
}

function onRemoveGroup(groupId: string) {
  if (isGroupAssigned(groupId) && !confirm('Remove this group? It is assigned in the grid.')) return
  store.removeGroup(groupId)
}

function onRemoveCategory(categoryId: string) {
  const hasGroups = (store.groupsByCategory[categoryId]?.length ?? 0) > 0
  if (hasGroups && !confirm('Remove this category and all its groups?')) return
  store.removeCategory(categoryId)
}

const availableCategoryPresets = computed(() => {
  const existingNames = new Set(Object.values(store.categories).map((c) => c.name))
  return CATEGORY_PRESETS.filter((name) => !existingNames.has(name))
})

function availableGroupPresets(categoryId: string) {
  const existingNames = new Set(
    (store.groupsByCategory[categoryId] ?? []).map(([, g]) => g.name),
  )
  return GROUP_PRESETS.filter((name) => !existingNames.has(name))
}

const hasAnyPresets = computed(() => {
  if (availableCategoryPresets.value.length > 0) return true
  return Object.keys(store.categories).some(
    (categoryId) => availableGroupPresets(categoryId).length > 0,
  )
})
</script>

<template>
  <details open>
    <summary
      class="mb-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm font-semibold uppercase tracking-wider text-muted-foreground select-none"
    >
      Groups
    </summary>
    <div v-for="[categoryId] in Object.entries(store.categories)" :key="categoryId" class="mb-2">
      <div class="group/cat mb-1 flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <InlineEdit
          :model-value="store.getCategoryName(categoryId)"
          placeholder="Category name"
          :auto-edit="autoEditCategoryId === categoryId"
          :readonly="store.collectionsReadonly"
          @update:model-value="store.renameCategory(categoryId, $event)"
        />
        <button
          v-if="!store.collectionsReadonly"
          class="ml-auto flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover/cat:opacity-100 group-has-focus-visible/cat:opacity-100"
          title="Remove category"
          @click="onRemoveCategory(categoryId)"
        >
          &times;
        </button>
      </div>
      <div class="flex flex-col gap-1">
        <GroupChip
          v-for="[groupId, group] in store.groupsByCategory[categoryId] ?? []"
          :key="groupId"
          :group-id="groupId"
          :label="store.getGroupLabel(groupId)"
          :removable="!store.collectionsReadonly"
          class="flex-1"
          @remove="onRemoveGroup(groupId)"
        >
          <InlineEdit
            :model-value="group.name"
            placeholder="Group name"
            :auto-edit="autoEditId === groupId"
            :readonly="store.collectionsReadonly"
            @update:model-value="store.renameGroup(groupId, $event)"
          />
        </GroupChip>
        <template v-if="showBoost && !store.collectionsReadonly">
          <button
            v-for="name in availableGroupPresets(categoryId)"
            :key="name"
            class="w-full rounded bg-group/10 px-3 py-1.5 text-left text-sm font-medium leading-5 text-group-foreground/80 outline-none glass glass-group hover:bg-group/25 focus-visible:ring-2 focus-visible:ring-ring dark:text-group/80"
            @click="store.addGroup(categoryId, name)"
          >
            <span class="-ml-1">+</span> {{ name }}
          </button>
        </template>
      </div>
      <button
        v-if="!store.collectionsReadonly"
        class="mt-1 w-full rounded bg-group/10 px-3 py-1.5 text-left text-sm font-medium leading-5 text-group-foreground/80 outline-none glass glass-group hover:bg-group/25 focus-visible:ring-2 focus-visible:ring-ring dark:text-group/80"
        @click="autoEditId = store.addGroup(categoryId)"
      >
        <span class="-ml-1">+</span> Add group
      </button>
    </div>
    <template v-if="showBoost && !store.collectionsReadonly">
      <button
        v-for="name in availableCategoryPresets"
        :key="name"
        class="mb-1 w-full rounded bg-background px-3 py-1.5 text-left text-sm font-medium leading-5 text-muted-foreground outline-none glass glass-card hover:bg-card hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        @click="store.addCategory(name)"
      >
        <span class="-ml-1">+</span> {{ name }}
      </button>
    </template>
    <div v-if="!store.collectionsReadonly" class="mt-2 flex gap-1">
      <button
        class="flex-1 rounded bg-background px-3 py-1.5 text-left text-sm font-medium leading-5 text-muted-foreground outline-none glass glass-card hover:bg-card hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        @click="autoEditCategoryId = store.addCategory()"
      >
        <span class="-ml-1">+</span> Add category
      </button>
      <button
        v-if="hasAnyPresets"
        class="rainbow-rounded rainbow-border flex items-center justify-center rounded border border-border px-1.5 py-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        :class="showBoost ? 'bg-muted' : 'bg-card'"
        title="Boost"
        @click="showBoost = !showBoost"
      >
        <svg class="size-3.5 rainbow-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.94 1.5a.5.5 0 0 1 .44.74L7.26 6H12a.5.5 0 0 1 .4.8l-5.5 7a.5.5 0 0 1-.9-.54L8.12 10H4a.5.5 0 0 1-.4-.8l5-7a.5.5 0 0 1 .34-.2Z" />
        </svg>
      </button>
    </div>
    <div v-if="!route.meta.isDanceGroups && Object.keys(store.groups).length" class="mt-3">
      <SpacerChip class="w-full" />
    </div>
  </details>
</template>
