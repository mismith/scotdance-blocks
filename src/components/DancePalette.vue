<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'

import DanceChip from '@/components/DanceChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'

const store = useCompetitionStore()
const route = useRoute()

const isDanceGroups = computed(() => !!route.meta.isDanceGroups)
const isDemo = computed(() => route.path.startsWith('/demo'))

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
        :to="isDanceGroups
          ? { name: isDemo ? 'demo' : 'blocks' }
          : { name: isDemo ? 'demo-dance-groups' : 'dance-groups' }"
        class="float-right rounded border border-border px-2 py-1 -mt-1 text-xs font-normal normal-case tracking-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="
          isDanceGroups
            ? 'bg-primary text-primary-foreground hover:bg-primary/80'
            : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
        "
        @click.stop
        >{{ isDanceGroups ? 'Done' : 'Configure' }}</router-link
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
      class="mt-1 w-full rounded bg-dance/10 px-3 py-1.5 text-left text-sm font-medium leading-5 text-dance-foreground/80 outline-none glass glass-dance focus-visible:ring-2 focus-visible:ring-ring dark:text-dance/80"
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
