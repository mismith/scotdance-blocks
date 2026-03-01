<script setup lang="ts">
import { ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import GroupChip from '@/components/GroupChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'

const store = useCompetitionStore()

const autoEditId = ref<string | null>(null)
const autoEditCategoryId = ref<string | null>(null)

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
</script>

<template>
  <details open>
    <summary class="mb-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Groups</summary>
    <div
      v-for="[categoryId] in Object.entries(store.categories)"
      :key="categoryId"
      class="mb-2"
    >
      <div class="group/cat mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <InlineEdit
          :model-value="store.getCategoryName(categoryId)"
          placeholder="Category name"
          :auto-edit="autoEditCategoryId === categoryId"
          @update:model-value="store.renameCategory(categoryId, $event)"
        />
        <button
          class="ml-auto flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 group-hover/cat:opacity-100 group-has-focus-visible/cat:opacity-100"
          title="Remove category"
          @click="onRemoveCategory(categoryId)"
        >
          &times;
        </button>
      </div>
      <div class="flex flex-col gap-1">
        <GroupChip
          v-for="[groupId, group] in (store.groupsByCategory[categoryId] ?? [])"
          :key="groupId"
          :group-id="groupId"
          :label="store.getGroupLabel(groupId)"
          removable
          class="flex-1"
          @remove="onRemoveGroup(groupId)"
        >
          <InlineEdit
            :model-value="group.name"
            placeholder="Group name"
            :auto-edit="autoEditId === groupId"
            @update:model-value="store.renameGroup(groupId, $event)"
          />
        </GroupChip>
      </div>
      <button
        class="mt-1 w-full rounded bg-group/25 px-2 py-1 text-left text-xs font-medium leading-tight text-group-foreground outline-none hover:bg-group focus-visible:ring-2 focus-visible:ring-ring"
        @click="() => { autoEditId = store.addGroup(categoryId) }"
      >
        <span class="-ml-1">+</span> Add group
      </button>
    </div>
    <button
      class="mt-2 w-full rounded bg-accent/50 px-2 py-1 text-left text-xs font-medium leading-tight text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      @click="() => { autoEditCategoryId = store.addCategory() }"
    >
      <span class="-ml-1">+</span> Add category
    </button>
  </details>
</template>
