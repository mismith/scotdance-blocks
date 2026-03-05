import { computed, reactive } from 'vue'

import { isPlaceholderId } from '@/utils/id'
import { useCompetitionStore } from '@/stores/competition'

// --- Types ---

export interface ExportCell {
  /** Group name clusters, split by spacers */
  groupClusters: string[][]
  /** Judge display names */
  judges: string[]
}

export interface ExportDanceRow {
  type: 'dance'
  /** Display label: e.g. "Fling (4)" */
  danceLabel: string
  cells: Record<string, ExportCell>
}

export interface ExportFreeformRow {
  type: 'freeform'
  name: string
  description?: string
}

export interface ExportEventHeader {
  type: 'event-header'
  name: string
  description?: string
}

export type ExportRow = ExportDanceRow | ExportFreeformRow | ExportEventHeader

export interface ExportBlock {
  /** Page title: e.g. "Morning — January 27, 2018" */
  title: string
  description?: string
  rows: ExportRow[]
}

// --- Settings ---

export interface ExportSettings {
  showDescriptions: boolean
  eventNameInColumn: boolean
  showHeaderLabels: boolean
}

// Module-level so settings persist across dialog open/close within the session
const settings = reactive<ExportSettings>({
  showDescriptions: true,
  eventNameInColumn: false,
  showHeaderLabels: false,
})

// --- Composable ---

export function useScheduleExport() {
  const store = useCompetitionStore()

  const platformEntries = computed(() => store.platformEntries)

  const formattedDate = computed(() => {
    if (!store.schedule.date) return ''
    const d = new Date(store.schedule.date)
    return isNaN(d.getTime())
      ? store.schedule.date
      : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  })

  function buildCells(sd: { platforms: Record<string, { orderedGroupIds: string[]; orderedJudgeIds: string[] }> }) {
    const cells: Record<string, ExportCell> = {}
    for (const [platformId] of platformEntries.value) {
      const assignment = sd.platforms[platformId]
      if (!assignment) {
        cells[platformId] = { groupClusters: [], judges: [] }
        continue
      }

      // Split groups by spacers into clusters
      const groupClusters: string[][] = []
      let currentCluster: string[] = []
      for (const groupId of assignment.orderedGroupIds) {
        if (isPlaceholderId(groupId)) {
          if (currentCluster.length > 0) {
            groupClusters.push(currentCluster)
            currentCluster = []
          }
        } else {
          currentCluster.push(store.getGroupLabel(groupId, { abbreviate: false }))
        }
      }
      if (currentCluster.length > 0) {
        groupClusters.push(currentCluster)
      }

      cells[platformId] = {
        groupClusters,
        judges: assignment.orderedJudgeIds.map((id) => store.getStaffName(id)),
      }
    }
    return cells
  }

  function buildEventRows(event: { name: string; description?: string; dances?: Record<string, { danceId?: string; name: string; description?: string; platforms: Record<string, { orderedGroupIds: string[]; orderedJudgeIds: string[] }> }> }): ExportRow[] {
    const rows: ExportRow[] = []
    for (const [, sd] of Object.entries(event.dances ?? {})) {
      if (!sd.danceId) {
        rows.push({
          type: 'freeform',
          name: sd.name,
          description: sd.description,
        })
      } else {
        const dance = store.getDance(sd.danceId)
        const danceLabel =
          (dance?.name || dance?.shortName || 'Unknown') +
          (dance?.steps ? ` (${dance.steps})` : '')
        rows.push({ type: 'dance', danceLabel, cells: buildCells(sd) })
      }
    }
    return rows
  }

  const scheduleBlocks = computed<ExportBlock[]>(() => {
    const blocks: ExportBlock[] = []

    for (const [, block] of Object.entries(store.blocks)) {
      const titleParts = [block.name, formattedDate.value].filter(Boolean)
      const blockTitle = titleParts.join(' — ')

      const exportBlock: ExportBlock = {
        title: blockTitle,
        description: block.description,
        rows: [],
      }
      for (const [, event] of Object.entries(block.events)) {
        exportBlock.rows.push({
          type: 'event-header',
          name: event.name,
          description: event.description,
        })
        exportBlock.rows.push(...buildEventRows(event))
      }
      blocks.push(exportBlock)
    }

    return blocks
  })

  return {
    settings,
    scheduleBlocks,
    platformEntries,
  }
}
