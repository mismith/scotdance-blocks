<script setup lang="ts">
import { ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import GroupChip from '@/components/GroupChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'

const store = useCompetitionStore()

const autoEditId = ref<string | null>(null)
const autoEditCategoryId = ref<string | null>(null)

function onRemoveGroup(groupId: string) {
  if (!confirm('Remove this group and all its assignments?')) return
  store.removeGroup(groupId)
}

function onRemoveCategory(categoryId: string) {
  if (!confirm('Remove this category and all its groups?')) return
  store.removeCategory(categoryId)
}
</script>

<template>
  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Groups</h3>
    <div
      v-for="[categoryId] in Object.entries(store.categories)"
      :key="categoryId"
      class="mb-2"
    >
      <div class="group/cat mb-1 flex items-center gap-1 text-xs font-medium text-gray-400">
        <InlineEdit
          :model-value="store.getCategoryName(categoryId)"
          placeholder="Category name"
          :auto-edit="autoEditCategoryId === categoryId"
          @update:model-value="store.renameCategory(categoryId, $event)"
        />
        <button
          class="ml-auto text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover/cat:opacity-100"
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
        class="mt-1 w-full rounded bg-blue-100/25 px-2 py-1 text-left text-xs font-medium leading-tight text-blue-800 hover:bg-blue-100"
        @click="() => { autoEditId = store.addGroup(categoryId) }"
      >
        <span class="-ml-1">+</span> Add group
      </button>
    </div>
    <button
      class="mt-2 w-full rounded bg-gray-100/50 px-2 py-1 text-left text-xs font-medium leading-tight text-gray-500 hover:bg-gray-100"
      @click="() => { autoEditCategoryId = store.addCategory() }"
    >
      <span class="-ml-1">+</span> Add category
    </button>
  </div>
</template>
