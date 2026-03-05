<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/composables/useAuth'
import { usePersistence } from '@/composables/usePersistence'

const props = defineProps<{ label?: string }>()
const emit = defineEmits<{ new: [] }>()

const router = useRouter()
const { isAuthenticated } = useAuth()
const {
  projects,
  activeProjectId,
  loadProject,
  deleteProject,
  refreshProjects,
} = usePersistence()

const isOpen = ref(false)

const anchorEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(anchorEl, floatingEl, {
  placement: 'bottom',
  middleware: [offset(6), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
})

watch(isOpen, (open) => {
  if (open && isAuthenticated.value) {
    refreshProjects()
  }
})

async function handleOpenProject(projectId: string) {
  await loadProject(projectId)
  isOpen.value = false
  // Navigate to editor if not already there (e.g. from HomeView)
  if (!router.currentRoute.value.path.startsWith('/blocks')) {
    router.push('/blocks')
  }
}

async function handleDeleteProject(projectId: string) {
  if (!confirm('Delete this competition? This cannot be undone.')) return
  await deleteProject(projectId)
}

function formatDate(timestamp: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="flex items-center">
    <!-- Chevron dropdown trigger -->
    <button
      ref="anchorEl"
      class="flex items-center gap-1 rounded-md p-1.5 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      title="Competitions"
      @click="isOpen = !isOpen"
    >
      <span v-if="label" class="text-sm">{{ label }}</span>
      <svg
        class="size-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </button>

    <!-- New competition button -->
    <button
      class="rounded-md p-1.5 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      title="New competition"
      @click="$emit('new')"
    >
      <svg
        class="size-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      >
        <path d="M8 3v10M3 8h10" />
      </svg>
    </button>

    <!-- Floating dropdown -->
    <Teleport to="body">
      <template v-if="isOpen">
        <div class="fixed inset-0 z-40" @click="isOpen = false" />
        <div
          ref="floatingEl"
          class="z-50 max-w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          :style="floatingStyles"
        >
          <!-- Not authenticated -->
          <div
            v-if="!isAuthenticated"
            class="px-4 py-3 text-xs text-muted-foreground"
          >
            Sign in to save and load competitions.
          </div>

          <!-- Authenticated: project list -->
          <template v-else>
            <div
              v-if="projects.length === 0"
              class="px-4 py-3 text-xs text-muted-foreground"
            >
              No saved competitions yet.
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div
                v-for="project in projects"
                :key="project.id"
                role="button"
                tabindex="0"
                class="group flex w-full items-center gap-2 px-4 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
                :class="activeProjectId === project.id ? 'bg-muted' : ''"
                @click="handleOpenProject(project.id)"
                @keydown.enter="handleOpenProject(project.id)"
                @keydown.space.prevent="handleOpenProject(project.id)"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm text-foreground">
                    {{ project.name || 'Untitled competition' }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatDate(project.updatedAt) }}
                  </p>
                </div>
                <button
                  class="shrink-0 rounded p-1 text-muted-foreground/60 opacity-0 outline-none hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  title="Delete"
                  @click.stop="handleDeleteProject(project.id)"
                >
                  <svg
                    class="size-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </Teleport>
  </div>
</template>
