<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useCompetitionStore } from '@/stores/competition'

import AddPopover from '@/components/AddPopover.vue'
import type { AddPopoverItem } from '@/components/AddPopover.vue'
import DanceChip from '@/components/DanceChip.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import { DANCE_PRESETS } from '@/data/presets'

const store = useCompetitionStore()
const route = useRoute()

const isDanceGroups = computed(() => !!route.meta.isDanceGroups)
const isDemo = computed(() => route.path.startsWith('/demo'))

const autoEditId = ref<string | null>(null)
const nameRefs = ref<Record<string, InstanceType<typeof InlineEdit> | null>>({})
const stepsRefs = ref<Record<string, InstanceType<typeof InlineEdit> | null>>({})
const showPopover = ref(false)
const addBtnEl = ref<HTMLElement | null>(null)

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

const popoverItems = computed<AddPopoverItem[]>(() =>
  availablePresets.value.map((p) => ({
    key: `${p.name}-${p.steps ?? ''}`,
    label: p.shortName || p.name,
    sublabel: p.steps ? `(${p.steps})` : undefined,
  })),
)

function onSelectPreset(item: AddPopoverItem) {
  const preset = availablePresets.value.find(
    (p) => `${p.name}-${p.steps ?? ''}` === item.key,
  )
  if (preset) store.addDanceFromPreset(preset)
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
          :ref="(el: any) => (nameRefs[danceId] = el)"
          :model-value="dance.shortName || dance.name"
          placeholder="Name"
          :auto-edit="autoEditId === danceId"
          :readonly="store.collectionsReadonly"
          @update:model-value="
            store.updateDance(danceId, dance.shortName ? { shortName: $event } : { name: $event })
          "
          @tab="stepsRefs[danceId]?.startEdit()"
        />
        <span v-if="!store.collectionsReadonly || dance.steps" class="text-dance-foreground/50"
          >{{ ' ' }}(<InlineEdit
            :ref="(el: any) => (stepsRefs[danceId] = el)"
            :model-value="dance.steps ?? ''"
            placeholder="Steps"
            :required="false"
            :readonly="store.collectionsReadonly"
            @update:model-value="store.updateDance(danceId, { steps: $event })"
            @shift-tab="nameRefs[danceId]?.startEdit()"
          />)</span
        >
      </DanceChip>
    </div>
    <div v-if="!store.collectionsReadonly" class="mt-1">
      <button
        ref="addBtnEl"
        data-add="dance"
        class="w-full rounded-lg bg-dance/10 px-3 py-1.5 text-left text-sm font-medium leading-5 text-dance-foreground/80 outline-none glass glass-dance hover:bg-dance/25 focus-visible:ring-2 focus-visible:ring-ring dark:text-dance/80"
        @click="showPopover = !showPopover"
      >
        <span class="-ml-1">+</span> Add dance
      </button>
      <AddPopover
        :anchor="addBtnEl"
        :open="showPopover"
        :items="popoverItems"
        placeholder="Type new dance name..."
        popover-class="bg-dance/10 text-dance-foreground/80 glass glass-dance dark:text-dance/80"
        @close="showPopover = false"
        @select="onSelectPreset"
        @add="store.addDance($event)"
      />
    </div>
  </details>
</template>
