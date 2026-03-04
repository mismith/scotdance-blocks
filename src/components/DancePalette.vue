<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'

import DanceChip from '@/components/DanceChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import { DANCE_PRESETS } from '@/data/presets'

const store = useCompetitionStore()
const route = useRoute()

const isDanceGroups = computed(() => !!route.meta.isDanceGroups)
const isDemo = computed(() => route.path.startsWith('/demo'))

const autoEditId = ref<string | null>(null)
const showBoost = ref(false)

function onRemoveDance(danceId: string) {
  const isScheduled = Object.values(store.blocks).some((block) =>
    Object.values(block.events).some((event) =>
      Object.values(event.dances ?? {}).some((sd) => sd.danceId === danceId),
    ),
  )
  if (isScheduled && !confirm('Remove this dance? It is scheduled in the grid.')) return
  store.removeDance(danceId)
}

const availablePresets = computed(() => {
  const existingDances = Object.values(store.dances)
  return DANCE_PRESETS.filter(
    (preset) =>
      !existingDances.some(
        (d) => d.name === preset.name && (d.steps ?? '') === (preset.steps ?? ''),
      ),
  )
})

function onAddPreset(preset: (typeof DANCE_PRESETS)[number]) {
  store.addDanceFromPreset(preset)
}
</script>

<template>
  <details open>
    <summary
      class="mb-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm font-semibold uppercase tracking-wider text-muted-foreground select-none"
    >
      <router-link
        v-if="isDanceGroups || (Object.keys(store.dances).length > 0 && Object.keys(store.groups).length > 0)"
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
      <template v-if="showBoost && !store.collectionsReadonly">
        <button
          v-for="preset in availablePresets"
          :key="`${preset.name}-${preset.steps ?? ''}`"
          class="w-full rounded bg-dance/10 px-3 py-1.5 text-left text-sm font-medium leading-5 text-dance-foreground/80 outline-none glass glass-dance hover:bg-dance/25 focus-visible:ring-2 focus-visible:ring-ring dark:text-dance/80"
          @click="onAddPreset(preset)"
        >
          <span class="-ml-1">+</span> {{ preset.shortName || preset.name }}<span v-if="preset.steps" class="text-dance-foreground/50"> ({{ preset.steps }})</span>
        </button>
      </template>
    </div>
    <div v-if="!store.collectionsReadonly" class="mt-1 flex gap-1">
      <button
        class="flex-1 rounded bg-dance/10 px-3 py-1.5 text-left text-sm font-medium leading-5 text-dance-foreground/80 outline-none glass glass-dance hover:bg-dance/25 focus-visible:ring-2 focus-visible:ring-ring dark:text-dance/80"
        @click="autoEditId = store.addDance()"
      >
        <span class="-ml-1">+</span> Add dance
      </button>
      <button
        v-if="availablePresets.length > 0"
        class="rainbow-rounded rainbow-border flex items-center justify-center rounded border border-border px-1.5 py-1 text-dance-foreground/60 outline-none hover:bg-dance/10 hover:text-dance-foreground focus-visible:ring-2 focus-visible:ring-ring"
        :class="showBoost ? 'bg-dance/10' : 'bg-card'"
        title="Boost"
        @click="showBoost = !showBoost"
      >
        <svg class="size-3.5 rainbow-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.94 1.5a.5.5 0 0 1 .44.74L7.26 6H12a.5.5 0 0 1 .4.8l-5.5 7a.5.5 0 0 1-.9-.54L8.12 10H4a.5.5 0 0 1-.4-.8l5-7a.5.5 0 0 1 .34-.2Z" />
        </svg>
      </button>
    </div>
  </details>
</template>
