<script setup lang="ts">
import { makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref as vueRef } from 'vue'

import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import GroupChip from '@/components/GroupChip.vue'
import JudgeChip from '@/components/JudgeChip.vue'
import type { CellLocation, DragGroupData, DragJudgeData, PlatformAssignment } from '@/types'

const props = defineProps<{
  assignment: PlatformAssignment | undefined
  location: CellLocation
}>()

const store = useCompetitionStore()
const el = vueRef<HTMLElement | null>(null)
const { provider, activeDragGroup } = useDragType()

function getInsertIndex(chipSelector: string, pointerY: number): number | undefined {
  if (!el.value) return undefined
  const chips = el.value.querySelectorAll(chipSelector)
  if (!chips.length) return 0
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

// Valid target: highlight when a group or judge is being dragged anywhere
const validTargetClass = computed(() => {
  if (activeDragGroup.value === 'group') return 'bg-blue-50'
  if (activeDragGroup.value === 'judge') return 'bg-amber-50'
  return ''
})

// Live insertion index for visual indicator — only for the matching type
const liveGroupInsertIndex = computed(() => {
  if (!isDragOver.value || activeDragGroup.value !== 'group') return -1
  const pointerY = provider.pointer.value?.current.y
  if (pointerY === undefined) return -1
  return getInsertIndex('[data-group-chip]', pointerY) ?? -1
})

const liveJudgeInsertIndex = computed(() => {
  if (!isDragOver.value || activeDragGroup.value !== 'judge') return -1
  const pointerY = provider.pointer.value?.current.y
  if (pointerY === undefined) return -1
  return getInsertIndex('[data-judge-chip]', pointerY) ?? -1
})
</script>

<template>
  <div
    ref="el"
    class="border-t border-l border-gray-200 px-2 py-1.5 transition-colors"
    :class="validTargetClass"
  >
    <template v-if="assignment">
      <div class="flex flex-col gap-0.5">
        <template v-for="(groupId, index) in assignment.orderedGroupIds" :key="groupId">
          <div
            v-if="isDragOver && liveGroupInsertIndex === index"
            class="h-0.5 -my-0.5 relative z-10 rounded bg-blue-500"
          />
          <GroupChip
            :label="store.getGroupLabel(groupId)"
            :group-id="groupId"
            :index="index"
            :source="location"
            removable
            @remove="store.removeGroupFromCell(location.blockId, location.eventId, location.danceId, location.platformId, groupId)"
          />
        </template>
        <div
          v-if="isDragOver && liveGroupInsertIndex === (assignment?.orderedGroupIds.length ?? 0)"
          class="h-0.5 -my-0.5 relative z-10 rounded bg-blue-500"
        />
      </div>
      <div v-if="assignment.orderedJudgeIds.length || (isDragOver && liveJudgeInsertIndex >= 0)" class="mt-1 flex flex-col gap-0.5">
        <template v-for="(judgeId, index) in assignment.orderedJudgeIds" :key="judgeId">
          <div
            v-if="isDragOver && liveJudgeInsertIndex === index"
            class="h-0.5 -my-0.5 relative z-10 rounded bg-blue-500"
          />
          <JudgeChip
            :label="store.getStaffName(judgeId)"
            :judge-id="judgeId"
            :index="index"
            :source="location"
            removable
            @remove="store.removeJudgeFromCell(location.blockId, location.eventId, location.danceId, location.platformId, judgeId)"
          />
        </template>
        <div
          v-if="isDragOver && liveJudgeInsertIndex === assignment.orderedJudgeIds.length"
          class="h-0.5 -my-0.5 relative z-10 rounded bg-blue-500"
        />
      </div>
    </template>
    <template v-else>
      <div
        v-if="isDragOver && (liveGroupInsertIndex === 0 || liveJudgeInsertIndex === 0)"
        class="h-0.5 -my-0.5 relative z-10 rounded bg-blue-500"
      />
      <span v-else class="text-xs text-gray-300">&mdash;</span>
    </template>
  </div>
</template>
