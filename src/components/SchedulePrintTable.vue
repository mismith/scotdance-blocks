<script setup lang="ts">
import type { ExportDanceRow, ExportRow } from '@/composables/useScheduleExport'
import { useScheduleExport } from '@/composables/useScheduleExport'
import { useCompetitionStore } from '@/stores/competition'

const store = useCompetitionStore()
const { settings, scheduleBlocks, platformEntries } = useScheduleExport()

interface RenderRow {
  /** Text for the dance-name column cell, or undefined to skip (covered by prior rowspan) */
  nameCell?: { text: string; rowspan: number }
  cells: { text: string; isJudge: boolean }[]
}

/** Whether the row at `index` is the first non-event-header row after an event-header */
function isFirstInEvent(rows: ExportRow[], index: number): boolean {
  return index === 0 || rows[index - 1]?.type === 'event-header'
}

/** Returns the event-header that owns the row at `index` (searching backwards) */
function getEventHeader(rows: ExportRow[], index: number) {
  for (let i = index - 1; i >= 0; i--) {
    if (rows[i].type === 'event-header') return rows[i] as ExportRow & { type: 'event-header' }
  }
  return undefined
}

/** Returns the index of the event-header that owns the row at `index` */
function findEventIndex(rows: ExportRow[], index: number): number {
  for (let i = index - 1; i >= 0; i--) {
    if (rows[i].type === 'event-header') return i
  }
  return -1
}

/**
 * Counts total <tr> rows for all children of the event-header at `eventIndex`.
 */
function getEventChildRowspan(rows: ExportRow[], eventIndex: number): number {
  let count = 0
  for (let i = eventIndex + 1; i < rows.length; i++) {
    if (rows[i].type === 'event-header') break
    const row = rows[i]
    if (row.type === 'dance') {
      count += getDanceRenderRows(row).length
    } else {
      count += 1
    }
  }
  return count
}

/**
 * Expands a single ExportDanceRow into multiple <tr> render rows.
 *
 * When `showHeaderLabels` is on, the judge row gets its own name cell ("Judge")
 * and the dance label only spans the group rows — matching traditional printed schedules.
 *
 * When off, the dance label spans all rows (judge + group) as a single merged cell.
 */
function getDanceRenderRows(row: ExportDanceRow): RenderRow[] {
  const platforms = platformEntries.value

  // Flatten group clusters into lines per platform (spacers = blank line)
  const groupLinesMap: Record<string, string[]> = {}
  for (const [platformId] of platforms) {
    const cell = row.cells[platformId]
    if (!cell) {
      groupLinesMap[platformId] = []
      continue
    }
    const lines: string[] = []
    for (let ci = 0; ci < cell.groupClusters.length; ci++) {
      if (ci > 0) lines.push('') // spacer gap
      for (const group of cell.groupClusters[ci]) {
        lines.push(group)
      }
    }
    groupLinesMap[platformId] = lines
  }

  const maxGroupLines = Math.max(0, ...platforms.map(([pid]) => groupLinesMap[pid].length))
  const hasJudges = platforms.some(([pid]) => (row.cells[pid]?.judges.length ?? 0) > 0)

  const judgeCells = platforms.map(([pid]) => ({
    text: row.cells[pid]?.judges.join(', ') ?? '',
    isJudge: true,
  }))

  const renderRows: RenderRow[] = []

  if (settings.showHeaderLabels && hasJudges) {
    // Header labels mode: judge row gets its own "Judge" name cell,
    // dance label only spans the group rows
    const groupRowCount = maxGroupLines || 1

    // Judge row above with "Judge" label
    renderRows.push({
      nameCell: { text: 'Judge', rowspan: 1 },
      cells: judgeCells,
    })
    // Group rows — first gets the dance label
    for (let i = 0; i < maxGroupLines; i++) {
      renderRows.push({
        nameCell: i === 0 ? { text: row.danceLabel, rowspan: groupRowCount } : undefined,
        cells: platforms.map(([pid]) => ({
          text: groupLinesMap[pid][i] ?? '',
          isJudge: false,
        })),
      })
    }
    // If no groups, still add a row for the dance label
    if (maxGroupLines === 0) {
      renderRows.push({
        nameCell: { text: row.danceLabel, rowspan: 1 },
        cells: platforms.map(() => ({ text: '', isJudge: false })),
      })
    }
  } else {
    // Default mode: dance label spans all rows (judge + group)
    const totalRows = (maxGroupLines + (hasJudges ? 1 : 0)) || 1

    // Judge row above
    if (hasJudges) {
      renderRows.push({
        nameCell: { text: row.danceLabel, rowspan: totalRows },
        cells: judgeCells,
      })
    }

    for (let i = 0; i < maxGroupLines; i++) {
      const isFirst = renderRows.length === 0
      renderRows.push({
        nameCell: isFirst ? { text: row.danceLabel, rowspan: totalRows } : undefined,
        cells: platforms.map(([pid]) => ({
          text: groupLinesMap[pid][i] ?? '',
          isJudge: false,
        })),
      })
    }

    // Fallback: empty row
    if (renderRows.length === 0) {
      renderRows.push({
        nameCell: { text: row.danceLabel, rowspan: 1 },
        cells: platforms.map(() => ({ text: '', isJudge: false })),
      })
    }
  }

  return renderRows
}

/** Total column count including optional event column */
const totalCols = () =>
  platformEntries.value.length + 1 + (settings.eventNameInColumn ? 1 : 0)
</script>

<template>
  <div class="print-preview">
    <!-- One page per block -->
    <div
      v-for="(block, bi) in scheduleBlocks"
      :key="bi"
      :class="{ 'break-before-page': bi > 0 }"
    >
      <!-- Competition name -->
      <p
        v-if="settings.showCompetitionName && store.schedule.name"
        class="text-sm font-medium text-center text-muted-foreground"
      >
        {{ store.schedule.name }}
      </p>

      <!-- Block title -->
      <h1 class="text-xl font-bold text-center">{{ block.title }}</h1>

      <p
        v-if="settings.showDescriptions && block.description"
        class="mt-1 text-sm text-center text-muted-foreground"
      >
        {{ block.description }}
      </p>

      <table class="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th v-if="settings.eventNameInColumn" class="border border-foreground/20 bg-foreground/10 p-2 text-left"></th>
            <th class="border border-foreground/20 bg-foreground/10 p-2 text-left">
              <template v-if="settings.showHeaderLabels">Dance</template>
            </th>
            <th
              v-for="[platformId, platform] in platformEntries"
              :key="platformId"
              class="border border-foreground/20 bg-foreground/10 p-2 text-center"
            >
              {{ platform.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, index) in block.rows" :key="index">
            <!-- Event header: row mode (full-width) -->
            <tr v-if="row.type === 'event-header' && !settings.eventNameInColumn">
              <td
                :colspan="totalCols()"
                class="border border-foreground/20 bg-muted/50 p-2 text-center font-semibold"
              >
                {{ row.name }}
                <span
                  v-if="settings.showDescriptions && row.description"
                  class="block text-xs font-normal text-muted-foreground"
                >
                  {{ row.description }}
                </span>
              </td>
            </tr>

            <!-- Event header: column mode, empty event (no children) — full-width -->
            <tr
              v-else-if="row.type === 'event-header' && settings.eventNameInColumn && getEventChildRowspan(block.rows, index) === 0"
            >
              <td
                :colspan="totalCols()"
                class="border border-foreground/20 p-2 text-center font-semibold"
              >
                {{ row.name }}
                <span
                  v-if="settings.showDescriptions && row.description"
                  class="block text-xs font-normal text-muted-foreground"
                >
                  {{ row.description }}
                </span>
              </td>
            </tr>
            <!-- Event header: column mode with children — skip row, rendered on first child -->

            <!-- Freeform row -->
            <tr v-else-if="row.type === 'freeform'">
              <!-- Event name column (first child in event, column mode) -->
              <td
                v-if="settings.eventNameInColumn && isFirstInEvent(block.rows, index)"
                :rowspan="getEventChildRowspan(block.rows, findEventIndex(block.rows, index))"
                class="border border-foreground/20 p-2 align-top font-semibold"
              >
                {{ getEventHeader(block.rows, index)?.name }}
                <span
                  v-if="settings.showDescriptions && getEventHeader(block.rows, index)?.description"
                  class="block text-xs font-normal text-muted-foreground"
                >
                  {{ getEventHeader(block.rows, index)?.description }}
                </span>
              </td>
              <td :colspan="platformEntries.length + 1" class="border border-foreground/20 p-2">
                <strong>{{ row.name }}</strong>
                <span
                  v-if="settings.showDescriptions && row.description"
                  class="block text-xs font-normal text-muted-foreground"
                >
                  {{ row.description }}
                </span>
              </td>
            </tr>

            <!-- Dance rows -->
            <template v-else-if="row.type === 'dance'">
              <tr v-for="(rrow, ri) in getDanceRenderRows(row)" :key="ri">
                <!-- Event name column (first child in event, column mode, first render row) -->
                <td
                  v-if="settings.eventNameInColumn && isFirstInEvent(block.rows, index) && ri === 0"
                  :rowspan="getEventChildRowspan(block.rows, findEventIndex(block.rows, index))"
                  class="border border-foreground/20 p-2 align-top font-semibold"
                >
                  {{ getEventHeader(block.rows, index)?.name }}
                  <span
                    v-if="settings.showDescriptions && getEventHeader(block.rows, index)?.description"
                    class="block text-xs font-normal text-muted-foreground"
                  >
                    {{ getEventHeader(block.rows, index)?.description }}
                  </span>
                </td>

                <!-- Dance name / Judge label cell -->
                <td
                  v-if="rrow.nameCell"
                  :rowspan="rrow.nameCell.rowspan"
                  class="border border-foreground/20 p-2 align-top whitespace-nowrap"
                  :class="rrow.nameCell.text === 'Judge' ? 'font-bold italic bg-foreground/5' : ''"
                >
                  {{ rrow.nameCell.text }}
                </td>

                <!-- Platform cells -->
                <td
                  v-for="(cell, ci) in rrow.cells"
                  :key="ci"
                  class="border border-foreground/20 p-1.5"
                  :class="cell.isJudge ? 'font-bold italic bg-foreground/5' : ''"
                >
                  {{ cell.text }}
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Force light-mode colors so the preview always looks like printed output */
.print-preview {
  --background: var(--color-white);
  --foreground: var(--color-zinc-900);
  --muted: var(--color-zinc-200);
  --muted-foreground: var(--color-zinc-500);
  --border: var(--color-zinc-300);

  color: var(--foreground);
  background: var(--background);
}

.break-before-page {
  break-before: page;
  margin-top: 3rem;
}
</style>
