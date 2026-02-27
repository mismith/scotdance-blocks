<script setup lang="ts">
import { ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import InlineEdit from '@/components/InlineEdit.vue'
import JudgeChip from '@/components/JudgeChip.vue'

const store = useCompetitionStore()

const expandedId = ref<string | null>(null)

function toggleExpand(staffId: string) {
  expandedId.value = expandedId.value === staffId ? null : staffId
}

function onRemoveStaff(staffId: string) {
  if (!confirm('Remove this judge and all their assignments?')) return
  store.removeStaffMember(staffId)
}
</script>

<template>
  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Judges</h3>
    <div class="flex flex-col gap-1">
      <div v-for="[staffId, member] in Object.entries(store.staff)" :key="staffId">
        <div class="group/row flex items-center gap-1">
          <JudgeChip
            :judge-id="staffId"
            :label="store.getStaffName(staffId)"
            class="flex-1"
          />
          <button
            class="text-gray-400 opacity-0 transition-opacity hover:text-blue-500 group-hover/row:opacity-100"
            title="Edit judge"
            @click="toggleExpand(staffId)"
          >
            &#9998;
          </button>
          <button
            class="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover/row:opacity-100"
            title="Remove judge"
            @click="onRemoveStaff(staffId)"
          >
            &times;
          </button>
        </div>
        <div v-if="expandedId === staffId" class="mt-1 ml-1 flex flex-col gap-1 text-xs">
          <label class="flex items-center gap-1 text-gray-500">
            First
            <InlineEdit
              :model-value="member.firstName"
              placeholder="First name"
              @update:model-value="store.renameStaffMember(staffId, $event, member.lastName)"
            />
          </label>
          <label class="flex items-center gap-1 text-gray-500">
            Last
            <InlineEdit
              :model-value="member.lastName"
              placeholder="Last name"
              @update:model-value="store.renameStaffMember(staffId, member.firstName, $event)"
            />
          </label>
        </div>
      </div>
    </div>
    <button
      class="mt-1 w-full rounded bg-amber-100/25 px-2 py-1 text-left text-xs font-medium italic leading-tight text-amber-800 hover:bg-amber-100"
      @click="store.addStaffMember()"
    >
      <span class="-ml-1">+</span> Add judge
    </button>
  </div>
</template>
