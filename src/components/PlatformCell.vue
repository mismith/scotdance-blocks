<script setup lang="ts">
import { makeDroppable } from '@vue-dnd-kit/core'
import { ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import GroupChip from '@/components/GroupChip.vue'
import JudgeChip from '@/components/JudgeChip.vue'
import type { CellLocation, DragGroupData, DragJudgeData, PlatformAssignment } from '@/types'

const props = defineProps<{
  assignment: PlatformAssignment | undefined
  location: CellLocation
}>()

const store = useCompetitionStore()
const el = vueRef<HTMLElement | null>(null)

function getInsertIndex(chipSelector: string, pointerY: number): number | undefined {
  if (!el.value) return undefined
  const chips = el.value.querySelectorAll(chipSelector)
  if (!chips.length) return undefined
  for (let i = 0; i < chips.length; i++) {
    const rect = chips[i].getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) return i
  }
  return chips.length
}

function isSameCell(source: CellLocation): boolean {
  return (
    source.blockId === props.location.blockId &&
    source.eventId === props.location.eventId &&
    source.danceId === props.location.danceId &&
    source.platformId === props.location.platformId
  )
}

const { isDragOver } = makeDroppable(el, {
  groups: ['group', 'judge'],
  events: {
    onDrop(event) {
      const dragData = event.payload?.items[0] as DragGroupData | DragJudgeData | undefined
      if (!dragData) return

      const pointerY = event.provider.pointer.value?.current.y ?? 0
      const loc = props.location

      if (dragData.type === 'group') {
        const insertIndex = getInsertIndex('[data-group-chip]', pointerY)

        if (dragData.source !== 'palette' && isSameCell(dragData.source)) {
          // Reorder within same cell
          if (insertIndex !== undefined) {
            store.reorderGroupInCell(
              loc.blockId,
              loc.eventId,
              loc.danceId,
              loc.platformId,
              dragData.index,
              insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
            )
          }
        } else if (dragData.source === 'palette') {
          store.addGroupToCell(loc.blockId, loc.eventId, loc.danceId, loc.platformId, dragData.groupId, insertIndex)
        } else {
          store.moveGroup(
            dragData.source.blockId,
            dragData.source.eventId,
            dragData.source.danceId,
            dragData.source.platformId,
            loc.blockId,
            loc.eventId,
            loc.danceId,
            loc.platformId,
            dragData.groupId,
            insertIndex,
          )
        }
      } else if (dragData.type === 'judge') {
        const insertIndex = getInsertIndex('[data-judge-chip]', pointerY)

        if (dragData.source !== 'palette' && isSameCell(dragData.source)) {
          if (insertIndex !== undefined) {
            store.reorderJudgeInCell(
              loc.blockId,
              loc.eventId,
              loc.danceId,
              loc.platformId,
              dragData.index,
              insertIndex > dragData.index ? insertIndex - 1 : insertIndex,
            )
          }
        } else if (dragData.source === 'palette') {
          store.addJudgeToCell(loc.blockId, loc.eventId, loc.danceId, loc.platformId, dragData.judgeId, insertIndex)
        } else {
          store.moveJudge(
            dragData.source.blockId,
            dragData.source.eventId,
            dragData.source.danceId,
            dragData.source.platformId,
            loc.blockId,
            loc.eventId,
            loc.danceId,
            loc.platformId,
            dragData.judgeId,
          )
        }
      }
    },
  },
})
</script>

<template>
  <td
    ref="el"
    class="border border-gray-200 px-2 py-1.5 align-top transition-colors"
    :class="isDragOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : ''"
  >
    <template v-if="assignment">
      <div class="flex flex-col gap-0.5">
        <GroupChip
          v-for="(groupId, index) in assignment.orderedGroupIds"
          :key="groupId"
          :label="store.getGroupLabel(groupId)"
          :group-id="groupId"
          :index="index"
          :source="location"
        />
      </div>
      <div v-if="assignment.orderedJudgeIds.length" class="mt-1 flex flex-col gap-0.5">
        <JudgeChip
          v-for="(judgeId, index) in assignment.orderedJudgeIds"
          :key="judgeId"
          :label="store.getStaffName(judgeId)"
          :judge-id="judgeId"
          :index="index"
          :source="location"
        />
      </div>
    </template>
    <span v-else class="text-xs text-gray-300">&mdash;</span>
  </td>
</template>
