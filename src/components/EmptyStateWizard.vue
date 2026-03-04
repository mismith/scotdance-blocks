<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCompetitionStore } from '@/stores/competition'
import { useDanceGroupsDialog } from '@/composables/useDanceGroupsDialog'
import AddPopover from '@/components/AddPopover.vue'
import ChevronRightIcon from '@/components/ChevronRightIcon.vue'
import { BLOCK_PRESETS } from '@/data/presets'

const store = useCompetitionStore()
const { open: openDanceGroupsDialog } = useDanceGroupsDialog()

const emit = defineEmits<{
  addPlatform: []
  addBlock: [name: string]
  autoFill: []
}>()

// Completion flags
const hasPlatforms = computed(() => store.platformEntries.length > 0)
const hasDances = computed(() => Object.keys(store.dances).length > 0)
const hasGroups = computed(() => Object.keys(store.groups).length > 0)
const hasDanceGroups = computed(() =>
  Object.values(store.dances).some((d) => Object.keys(d.groupIds).length > 0),
)
const hasJudges = computed(() => Object.values(store.staff).some((m) => m.type === 'Judge'))
const canAutofill = computed(
  () => hasPlatforms.value && hasDances.value && hasGroups.value && hasJudges.value,
)

// Block popover
const showBlockPopover = ref(false)
const addBlockBtnEl = ref<HTMLElement | null>(null)
const blockPopoverItems = computed(() => {
  const existingNames = new Set(Object.values(store.blocks).map((b) => b.name))
  return BLOCK_PRESETS.filter((name) => !existingNames.has(name)).map((name) => ({
    key: name,
    label: name,
  }))
})

function clickSidebarButton(selector: string) {
  const btn = document.querySelector<HTMLElement>(selector)
  if (btn) {
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    btn.click()
  }
}

function onConfigureDanceGroups() {
  openDanceGroupsDialog()
}
</script>

<template>
  <div class="flex flex-col items-center px-4 py-16">
    <template v-if="store.collectionsReadonly && (!hasPlatforms || !hasDances || !hasGroups)">
      <h2 class="mb-1 text-lg font-semibold text-foreground">Missing competition data</h2>
      <p class="max-w-sm text-center text-sm text-muted-foreground">
        {{ !hasPlatforms && !hasDances && !hasGroups
          ? 'No platforms, dances, or groups have been set up.'
          : `Missing ${[!hasPlatforms && 'platforms', !hasDances && 'dances', !hasGroups && 'groups'].filter(Boolean).join(', ')}.`
        }}
        Check that your competition data has been configured correctly.
      </p>
    </template>
    <template v-else>
      <h2 class="mb-1 text-lg font-semibold text-foreground">Build your schedule</h2>
      <p v-if="!store.collectionsReadonly" class="mb-8 max-w-sm text-center text-sm text-muted-foreground">
        Set up your competition in a few steps
      </p>
      <p v-else class="mb-8 max-w-sm text-center text-sm text-muted-foreground">
        Create a block or autofill to get started
      </p>

      <div class="grid w-full max-w-2xl gap-8" :class="store.collectionsReadonly ? 'max-w-xs grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'"
      <!-- Left column: Set up -->
      <div v-if="!store.collectionsReadonly" class="flex flex-col gap-3">
        <h3
          class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Set up
        </h3>

        <!-- Step 1: Platforms -->
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasPlatforms && 'opacity-50'"
          @click="emit('addPlatform')"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground"
          >
            <svg v-if="hasPlatforms" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>1</template>
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-foreground">Add platforms</div>
            <div class="text-xs text-muted-foreground">Set up stages or areas for dancing</div>
          </div>
          <ChevronRightIcon class="text-muted-foreground/40" />
        </button>

        <!-- Step 2: Dances -->
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasDances && 'opacity-50'"
          @click="clickSidebarButton('[data-add=dance]')"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasDances
                ? 'bg-dance/20 text-dance-foreground/60 dark:text-dance/40'
                : 'bg-dance/30 text-dance-foreground dark:text-dance'
            "
          >
            <svg v-if="hasDances" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>2</template>
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-foreground">Add dances</div>
            <div class="text-xs text-muted-foreground">
              Define the dances for your competition
            </div>
          </div>
          <ChevronRightIcon class="text-muted-foreground/40" />
        </button>

        <!-- Step 3: Groups -->
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasGroups && 'opacity-50'"
          @click="
            clickSidebarButton(
              Object.keys(store.categories).length > 0
                ? '[data-add=group]'
                : '[data-add=category]',
            )
          "
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasGroups
                ? 'bg-group/20 text-group-foreground/60 dark:text-group/40'
                : 'bg-group/30 text-group-foreground dark:text-group'
            "
          >
            <svg v-if="hasGroups" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>3</template>
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-foreground">Add categories &amp; groups</div>
            <div class="text-xs text-muted-foreground">Set up age categories and groups</div>
          </div>
          <ChevronRightIcon class="text-muted-foreground/40" />
        </button>

        <!-- Step 4: Configure dance groups -->
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="
            hasDanceGroups
              ? 'opacity-50 hover:bg-muted/50'
              : hasDances && hasGroups
                ? 'hover:bg-muted/50'
                : 'opacity-50'
          "
          :disabled="!hasDances || !hasGroups"
          @click="onConfigureDanceGroups"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasDanceGroups
                ? 'bg-dance/20 text-dance-foreground/60 dark:text-dance/40'
                : hasDances && hasGroups
                  ? 'bg-dance/30 text-dance-foreground dark:text-dance'
                  : 'bg-muted text-muted-foreground/60'
            "
          >
            <svg v-if="hasDanceGroups" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>4</template>
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-foreground">Configure dance groups</div>
            <div class="text-xs text-muted-foreground">
              Choose which groups dance which dances
            </div>
          </div>
          <ChevronRightIcon class="text-muted-foreground/40" />
        </button>

        <!-- Step 5: Judges -->
        <button
          class="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          :class="hasJudges && 'opacity-50'"
          @click="clickSidebarButton('[data-add=judge]')"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="
              hasJudges
                ? 'bg-judge/20 text-judge-foreground/60 dark:text-judge/40'
                : 'bg-judge/30 text-judge-foreground dark:text-judge'
            "
          >
            <svg v-if="hasJudges" class="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clip-rule="evenodd"
              />
            </svg>
            <template v-else>5</template>
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-foreground">Add judges</div>
            <div class="text-xs text-muted-foreground">Add your competition judges</div>
          </div>
          <ChevronRightIcon class="text-muted-foreground/40" />
        </button>
      </div>

      <!-- Right column: Then, build -->
      <div class="flex flex-col gap-3">
        <h3
          v-if="!store.collectionsReadonly"
          class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Then, build
        </h3>

        <!-- Create a block -->
        <button
          ref="addBlockBtnEl"
          class="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          @click="showBlockPopover = true"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/40 dark:bg-accent text-sm font-bold text-accent-foreground dark:text-accent-foreground"
            >+</span
          >
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-foreground">Create a block</div>
            <div class="text-xs text-muted-foreground">
              Manually build your schedule step by step
            </div>
          </div>
          <ChevronRightIcon class="text-muted-foreground/40" />
        </button>

        <!-- Autofill -->
        <button
          class="rainbow-rounded-xl rainbow-border flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="canAutofill ? 'hover:bg-muted/50' : 'opacity-50'"
          :disabled="!canAutofill"
          @click="emit('autoFill')"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground"
          >
            <svg class="size-4 rainbow-icon" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M8.94 1.5a.5.5 0 0 1 .44.74L7.26 6H12a.5.5 0 0 1 .4.8l-5.5 7a.5.5 0 0 1-.9-.54L8.12 10H4a.5.5 0 0 1-.4-.8l5-7a.5.5 0 0 1 .34-.2Z"
              />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-foreground">Autofill schedule</div>
            <div class="text-xs text-muted-foreground">
              Builds a full schedule instantly — just tweak from there
            </div>
            <div v-if="!canAutofill && !store.collectionsReadonly" class="mt-0.5 text-[11px] text-muted-foreground/60">
              Complete steps 1–5 to unlock
            </div>
          </div>
          <ChevronRightIcon class="text-muted-foreground/40" />
        </button>
      </div>
      </div>

      <AddPopover
        :anchor="addBlockBtnEl"
        :open="showBlockPopover"
        :items="blockPopoverItems"
        placeholder="Type new block name..."
        popover-class="border border-border bg-card"
        @close="showBlockPopover = false"
        @select="emit('addBlock', $event.label)"
        @add="emit('addBlock', $event)"
      />
    </template>
  </div>
</template>
