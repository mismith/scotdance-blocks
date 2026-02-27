<script setup lang="ts">
import { ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import DanceChip from '@/components/DanceChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'

const store = useCompetitionStore()

const expandedId = ref<string | null>(null)
const autoEditId = ref<string | null>(null)

function toggleExpand(danceId: string) {
  expandedId.value = expandedId.value === danceId ? null : danceId
}

function onRemoveDance(danceId: string) {
  if (!confirm('Remove this dance and all its scheduled instances?')) return
  store.removeDance(danceId)
}
</script>

<template>
  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Dances</h3>
    <div class="flex flex-col gap-1">
      <div v-for="[danceId, dance] in Object.entries(store.dances)" :key="danceId">
        <div class="group/row flex items-center gap-1">
          <DanceChip
            :dance-id="danceId"
            :label="dance.shortName || dance.name"
            :steps="dance.steps"
            class="flex-1"
          />
          <button
            class="text-gray-400 opacity-0 transition-opacity hover:text-blue-500 group-hover/row:opacity-100"
            title="Edit dance"
            @click="toggleExpand(danceId)"
          >
            &#9998;
          </button>
          <button
            class="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover/row:opacity-100"
            title="Remove dance"
            @click="onRemoveDance(danceId)"
          >
            &times;
          </button>
        </div>
        <div v-if="expandedId === danceId" class="mt-1 ml-1 flex flex-col gap-1 text-xs">
          <label class="flex items-center gap-1 text-gray-500">
            Name
            <InlineEdit
              :model-value="dance.name"
              placeholder="Name"
              :auto-edit="autoEditId === danceId"
              @update:model-value="store.updateDance(danceId, { name: $event })"
            />
          </label>
          <label class="flex items-center gap-1 text-gray-500">
            Short
            <InlineEdit
              :model-value="dance.shortName"
              placeholder="Short name"
              @update:model-value="store.updateDance(danceId, { shortName: $event })"
            />
          </label>
          <label class="flex items-center gap-1 text-gray-500">
            Steps
            <InlineEdit
              :model-value="dance.steps ?? ''"
              placeholder="Steps"
              @update:model-value="store.updateDance(danceId, { steps: $event })"
            />
          </label>
        </div>
      </div>
    </div>
    <button
      class="mt-1 w-full rounded bg-green-100/25 px-2 py-1 text-left text-xs font-medium leading-tight text-green-800 hover:bg-green-100"
      @click="() => { const id = store.addDance(); expandedId = id; autoEditId = id }"
    >
      <span class="-ml-1">+</span> Add dance
    </button>
  </div>
</template>
