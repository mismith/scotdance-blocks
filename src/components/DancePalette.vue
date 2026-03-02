<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'

import DanceChip from '@/components/DanceChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'

const store = useCompetitionStore()
const route = useRoute()

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
    <summary
      class="mb-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm font-semibold uppercase tracking-wider text-muted-foreground select-none"
    >
      <router-link
        :to="route.name === 'dance-groups' ? '/' : '/dance-groups'"
        class="float-right rounded border border-border px-2 py-1 -mt-1 text-xs font-normal normal-case tracking-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="
          route.name === 'dance-groups'
            ? 'bg-primary text-primary-foreground hover:bg-primary/80'
            : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
        "
        @click.stop
        >{{ route.name === 'dance-groups' ? 'Done' : 'Configure' }}</router-link
      >
      Dances
    </summary>
    <div class="flex flex-col gap-1">
      <DanceChip
        v-for="[danceId, dance] in Object.entries(store.dances)"
        :key="danceId"
        :dance-id="danceId"
        :label="dance.shortName || dance.name"
        :steps="dance.steps"
        :removable="!store.collectionsReadonly"
        class="flex-1"
        @remove="onRemoveDance(danceId)"
      >
        <InlineEdit
          :model-value="dance.shortName || dance.name"
          placeholder="Name"
          :auto-edit="autoEditId === danceId"
          :readonly="store.collectionsReadonly"
          @update:model-value="
            store.updateDance(danceId, dance.shortName ? { shortName: $event } : { name: $event })
          "
        />
        <span v-if="!store.collectionsReadonly || dance.steps" class="text-dance-foreground/50"
          >{{ ' ' }}(<InlineEdit
            :model-value="dance.steps ?? ''"
            placeholder="Steps"
            :required="false"
            :readonly="store.collectionsReadonly"
            @update:model-value="store.updateDance(danceId, { steps: $event })"
          />)</span
        >
      </DanceChip>
    </div>
    <button
      v-if="!store.collectionsReadonly"
      class="mt-1 w-full rounded bg-dance/25 px-3 py-1.5 text-left text-sm font-medium leading-tight text-dance-foreground/50 outline-none glass glass-dance hover:bg-dance hover:text-dance-foreground focus-visible:ring-2 focus-visible:ring-ring"
      @click="
        () => {
          autoEditId = store.addDance()
        }
      "
    >
      <span class="-ml-1">+</span> Add dance
    </button>
  </details>
</template>
