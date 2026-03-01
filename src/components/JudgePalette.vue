<script setup lang="ts">
import { ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import InlineEdit from '@/components/InlineEdit.vue'
import JudgeChip from '@/components/JudgeChip.vue'

const store = useCompetitionStore()

const autoEditId = ref<string | null>(null)

function onRemoveStaff(staffId: string) {
  const isAssigned = Object.values(store.blocks).some((block) =>
    Object.values(block.events).some((event) =>
      Object.values(event.dances ?? {}).some((sd) =>
        Object.values(sd.platforms).some((a) => a.orderedJudgeIds.includes(staffId)),
      ),
    ),
  )
  if (isAssigned && !confirm('Remove this judge? They are assigned in the grid.')) return
  store.removeStaffMember(staffId)
}
</script>

<template>
  <details open>
    <summary class="mb-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Judges</summary>
    <div class="flex flex-col gap-1">
      <JudgeChip
        v-for="[staffId, member] in Object.entries(store.staff)"
        :key="staffId"
        :judge-id="staffId"
        :label="store.getStaffName(staffId)"
        :removable="!store.collectionsReadonly"
        class="flex-1"
        @remove="onRemoveStaff(staffId)"
      >
        <InlineEdit
          :model-value="member.firstName"
          placeholder="First"
          :auto-edit="autoEditId === staffId"
          :readonly="store.collectionsReadonly"
          @update:model-value="store.renameStaffMember(staffId, $event, member.lastName)"
        />
        {{ ' ' }}
        <InlineEdit
          :model-value="member.lastName"
          placeholder="Last"
          :readonly="store.collectionsReadonly"
          @update:model-value="store.renameStaffMember(staffId, member.firstName, $event)"
        />
      </JudgeChip>
    </div>
    <button
      v-if="!store.collectionsReadonly"
      class="mt-1 w-full rounded bg-judge/25 px-2 py-1 text-left text-xs font-medium leading-tight text-judge-foreground outline-none hover:bg-judge focus-visible:ring-2 focus-visible:ring-ring"
      @click="() => { autoEditId = store.addStaffMember() }"
    >
      <span class="-ml-1">+</span> Add judge
    </button>
  </details>
</template>
