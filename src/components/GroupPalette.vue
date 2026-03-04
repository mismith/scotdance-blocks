<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'

import AddPopover from '@/components/AddPopover.vue'
import type { AddPopoverItem } from '@/components/AddPopover.vue'
import GroupChip from '@/components/GroupChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import SpacerChip from '@/components/SpacerChip.vue'
import { CATEGORY_PRESETS, GROUP_PRESETS } from '@/data/presets'

const store = useCompetitionStore()
const route = useRoute()

const autoEditId = ref<string | null>(null)
const autoEditCategoryId = ref<string | null>(null)

const showCategoryPopover = ref(false)
const categoryBtnEl = ref<HTMLElement | null>(null)

const openGroupPopoverCategoryId = ref<string | null>(null)
const groupBtnEls = ref<Record<string, HTMLElement | null>>({})

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

const categoryPopoverItems = computed<AddPopoverItem[]>(() => {
  const existingNames = new Set(Object.values(store.categories).map((c) => c.name))
  return CATEGORY_PRESETS.filter((name) => !existingNames.has(name)).map((name) => ({
    key: name,
    label: name,
  }))
})

function groupPopoverItems(categoryId: string): AddPopoverItem[] {
  const existingNames = new Set(
    (store.groupsByCategory[categoryId] ?? []).map(([, g]) => g.name),
  )
  return GROUP_PRESETS.filter((name) => !existingNames.has(name)).map((name) => ({
    key: name,
    label: name,
  }))
}

function onSelectCategory(item: AddPopoverItem) {
  store.addCategory(item.label)
}

function onSelectGroup(categoryId: string, item: AddPopoverItem) {
  store.addGroup(categoryId, item.label)
}
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
      </div>
      <div v-if="!store.collectionsReadonly" class="mt-1">
        <button
          :ref="(el) => { groupBtnEls[categoryId] = el as HTMLElement }"
          data-add="group"
          class="w-full rounded bg-group/10 px-3 py-1.5 text-left text-sm font-medium leading-5 text-group-foreground/80 outline-none glass glass-group hover:bg-group/25 focus-visible:ring-2 focus-visible:ring-ring dark:text-group/80"
          @click="openGroupPopoverCategoryId = openGroupPopoverCategoryId === categoryId ? null : categoryId"
        >
          <span class="-ml-1">+</span> Add group
        </button>
        <AddPopover
          :anchor="groupBtnEls[categoryId] ?? null"
          :open="openGroupPopoverCategoryId === categoryId"
          :items="groupPopoverItems(categoryId)"
          placeholder="Search groups..."
          @close="openGroupPopoverCategoryId = null"
          @select="onSelectGroup(categoryId, $event)"
          @add="store.addGroup(categoryId, $event)"
        />
      </div>
    </div>
    <div v-if="!store.collectionsReadonly" class="mt-2">
      <button
        ref="categoryBtnEl"
        data-add="category"
        class="w-full rounded bg-background px-3 py-1.5 text-left text-sm font-medium leading-5 text-muted-foreground outline-none glass glass-card hover:bg-card hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        @click="showCategoryPopover = !showCategoryPopover"
      >
        <span class="-ml-1">+</span> Add category
      </button>
      <AddPopover
        :anchor="categoryBtnEl"
        :open="showCategoryPopover"
        :items="categoryPopoverItems"
        placeholder="Search categories..."
        @close="showCategoryPopover = false"
        @select="onSelectCategory"
        @add="store.addCategory($event)"
      />
    </div>
    <div v-if="!route.meta.isDanceGroups && Object.keys(store.groups).length" class="mt-3">
      <SpacerChip class="w-full" />
    </div>
  </details>
</template>
