import { watchDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { generateId } from '@/utils/id'
import { createEmptyData, useCompetitionStore } from '@/stores/competition'
import { useAuth } from '@/composables/useAuth'
import type { CompetitionData } from '@/types'

const STORAGE_KEY = 'scotdance-blocks:data'
const PROJECT_KEY = 'scotdance-blocks:active-project'

export interface ProjectMeta {
  id: string
  name: string
  updatedAt: number
}

const activeProjectId = ref<string | null>(
  localStorage.getItem(PROJECT_KEY),
)
const projects = ref<ProjectMeta[]>([])
const isSyncing = ref(false)

/** Whether auto-save is enabled (disabled during route transitions). */
let autoSaveEnabled = true

export function usePersistence() {
  const store = useCompetitionStore()
  const { data } = storeToRefs(store)
  const route = useRoute()
  const { isAuthenticated, getIdToken, user } = useAuth()

  const isDemo = computed(() => route.path.startsWith('/demo'))

  // --- localStorage ---

  function restore(): boolean {
    if (isDemo.value) return false
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw) as CompetitionData
      if (parsed.categories && parsed.schedule) {
        store.loadData(parsed)
        return true
      }
    } catch {
      // corrupt data — ignore
    }
    return false
  }

  function saveToLocalStorage() {
    if (isDemo.value || !autoSaveEnabled) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value))
  }

  function clearLocalStorage() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PROJECT_KEY)
  }

  // --- Cloud (Cloudflare KV via API) ---

  async function fetchProjects(): Promise<ProjectMeta[]> {
    const token = await getIdToken()
    if (!token) return []
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }

  async function loadProject(projectId: string): Promise<boolean> {
    const token = await getIdToken()
    if (!token) return false
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false
      const projectData = (await res.json()) as CompetitionData
      store.loadData(projectData)
      activeProjectId.value = projectId
      localStorage.setItem(PROJECT_KEY, projectId)
      saveToLocalStorage()
      return true
    } catch {
      return false
    }
  }

  async function saveToCloud() {
    if (!isAuthenticated.value || isDemo.value || !activeProjectId.value) return
    const token = await getIdToken()
    if (!token) return
    isSyncing.value = true
    try {
      await fetch(`/api/projects/${activeProjectId.value}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.value.schedule.name || 'Untitled Competition',
          data: data.value,
        }),
      })
    } catch {
      // silent fail — localStorage has the data
    } finally {
      isSyncing.value = false
    }
  }

  async function createProject(
    name: string,
    projectData: CompetitionData,
  ): Promise<string | null> {
    const token = await getIdToken()
    if (!token) return null
    try {
      const id = generateId()
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name, data: projectData }),
      })
      if (!res.ok) return null
      activeProjectId.value = id
      localStorage.setItem(PROJECT_KEY, id)
      await refreshProjects()
      return id
    } catch {
      return null
    }
  }

  async function deleteProject(projectId: string): Promise<boolean> {
    const token = await getIdToken()
    if (!token) return false
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false
      if (activeProjectId.value === projectId) {
        activeProjectId.value = null
        localStorage.removeItem(PROJECT_KEY)
      }
      await refreshProjects()
      return true
    } catch {
      return false
    }
  }

  async function refreshProjects() {
    projects.value = await fetchProjects()
  }

  // --- Auto-save watchers ---

  function startAutoSave() {
    // localStorage: debounced 500ms
    watchDebounced(
      () => data.value,
      () => saveToLocalStorage(),
      { deep: true, debounce: 500 },
    )

    // Cloud: debounced 2000ms
    watchDebounced(
      () => data.value,
      () => saveToCloud(),
      { deep: true, debounce: 2000 },
    )

    // Flush to localStorage before page unload
    window.addEventListener('beforeunload', saveToLocalStorage)
  }

  // --- Sign-in migration ---

  watch(
    () => user.value,
    async (newUser, oldUser) => {
      if (newUser && !oldUser) {
        // Just signed in — refresh project list
        await refreshProjects()

        // Auto-migrate localStorage data if user has no cloud projects
        const hasLocalData = localStorage.getItem(STORAGE_KEY) !== null
        if (hasLocalData && projects.value.length === 0) {
          const name = data.value.schedule.name || 'Untitled Competition'
          await createProject(name, data.value)
        }
      }
    },
  )

  // --- New competition ---

  function newCompetition() {
    store.loadData(createEmptyData())
    activeProjectId.value = null
    clearLocalStorage()
  }

  // --- Route transition helpers ---

  function disableAutoSave() {
    autoSaveEnabled = false
  }
  function enableAutoSave() {
    autoSaveEnabled = true
  }

  return {
    activeProjectId,
    projects,
    isSyncing,
    restore,
    startAutoSave,
    newCompetition,
    loadProject,
    createProject,
    deleteProject,
    refreshProjects,
    disableAutoSave,
    enableAutoSave,
  }
}
