<script setup lang="ts">
import { ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import DanceChip from '@/components/DanceChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'

const store = useCompetitionStore()

const autoEditId = ref<string | null>(null)

function onRemoveDance(danceId: string) {
  const isScheduled = Object.values(store.blocks).some((block) =>
    Object.values(block.events).some((event) =>
      Object.values(event.dances ?? {}).some((sd) => sd.danceId === danceId),
    ),
  )
  if (isScheduled && !confirm('Remove this dance? It is scheduled in the grid.')) return
  store.removeDance(danceId)
}
</script>

<template>
  <details open>
    <summary class="mb-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Dances</summary>
    <div class="flex flex-col gap-1">
      <DanceChip
        v-for="[danceId, dance] in Object.entries(store.dances)"
        :key="danceId"
        :dance-id="danceId"
        :label="dance.shortName || dance.name"
        :steps="dance.steps"
        removable
        class="flex-1"
        @remove="onRemoveDance(danceId)"
      >
        <InlineEdit
          :model-value="dance.shortName || dance.name"
          placeholder="Name"
          :auto-edit="autoEditId === danceId"
          @update:model-value="store.updateDance(danceId, dance.shortName ? { shortName: $event } : { name: $event })"
        />
        <span class="text-dance-foreground/50">{{ ' ' }}(<InlineEdit
          :model-value="dance.steps ?? ''"
          placeholder="Steps"
          :required="false"
          @update:model-value="store.updateDance(danceId, { steps: $event })"
        />)</span>
      </DanceChip>
    </div>
    <button
      class="mt-1 w-full rounded bg-dance/25 px-2 py-1 text-left text-xs font-medium leading-tight text-dance-foreground outline-none hover:bg-dance focus-visible:ring-2 focus-visible:ring-ring"
      @click="() => { autoEditId = store.addDance() }"
    >
      <span class="-ml-1">+</span> Add dance
    </button>
  </details>
</template>
