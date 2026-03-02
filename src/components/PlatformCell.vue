<script setup lang="ts">
import { makeDroppable } from '@vue-dnd-kit/core'
import { computed, ref as vueRef } from 'vue'

import { isPlaceholderId } from '@/utils/id'
import { useCompetitionStore } from '@/stores/competition'

import { useDragType } from '@/composables/useDragType'
import DragIndicator from '@/components/DragIndicator.vue'
import GroupChip from '@/components/GroupChip.vue'
import JudgeChip from '@/components/JudgeChip.vue'
import SpacerChip from '@/components/SpacerChip.vue'
import type { CellLocation, DragGroupData, DragJudgeData, PlatformAssignment } from '@/types'

const props = defineProps<{
  assignment: PlatformAssignment | undefined
  location: CellLocation
}>()

const store = useCompetitionStore()
const el = vueRef<HTMLElement | null>(null)
const { provider, activeDragGroup, activeDragPayload } = useDragType()

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
        // reject if group is not eligible for this dance (spacers bypass this check)
        if (!isPlaceholderId(dragData.groupId)) {
          const scheduledDance =
            store.blocks[loc.blockId]?.events[loc.eventId]?.dances?.[loc.danceId]
          const dance = scheduledDance ? store.getDance(scheduledDance.danceId) : undefined
          if (dance && Object.keys(dance.groupIds).length > 0 && !dance.groupIds[dragData.groupId])
            return
        }

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
          store.addGroupToCell(
            loc.blockId,
            loc.eventId,
            loc.danceId,
            loc.platformId,
            dragData.groupId,
            insertIndex,
          )
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
          store.addJudgeToCell(
            loc.blockId,
            loc.eventId,
            loc.danceId,
            loc.platformId,
            dragData.judgeId,
            insertIndex,
          )
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

// Valid target: highlight when an eligible, non-duplicate group or judge is being dragged
const validTargetClass = computed(() => {
  if (activeDragGroup.value === 'group') {
    const payload = activeDragPayload.value
    if (payload?.type !== 'group') return ''
    const loc = props.location
    const scheduledDance = store.blocks[loc.blockId]?.events[loc.eventId]?.dances?.[loc.danceId]
    const dance = scheduledDance ? store.getDance(scheduledDance.danceId) : undefined
    if (!dance) return ''
    if (!isPlaceholderId(payload.groupId)) {
      // reject if group is not eligible for this dance
      if (Object.keys(dance.groupIds).length > 0 && !dance.groupIds[payload.groupId]) return ''
      // reject if group already exists in this cell (unless reordering within same cell)
      if (
        props.assignment?.orderedGroupIds.includes(payload.groupId) &&
        (payload.source === 'palette' || !isSameCell(payload.source))
      )
        return ''
    }
    return 'bg-group-muted before:absolute before:-inset-1 before:rounded-xl before:bg-group-muted before:-z-10 before:pointer-events-none'
  }
  if (activeDragGroup.value === 'judge') {
    const payload = activeDragPayload.value
    if (payload?.type !== 'judge') return ''
    // reject if judge already exists in this cell (unless reordering within same cell)
    if (
      props.assignment?.orderedJudgeIds.includes(payload.judgeId) &&
      (payload.source === 'palette' || !isSameCell(payload.source))
    )
      return ''
    return 'bg-judge-muted before:absolute before:-inset-1 before:rounded-xl before:bg-judge-muted before:-z-10 before:pointer-events-none'
  }
  return ''
})

// Live insertion index for visual indicator — only for the matching type
const liveGroupInsertIndex = computed(() => {
  if (!isDragOver.value || activeDragGroup.value !== 'group') return -1
  if (!validTargetClass.value) return -1
  const pointerY = provider.pointer.value?.current.y
  if (pointerY === undefined) return -1
  return getInsertIndex('[data-group-chip]', pointerY) ?? -1
})

// Dim cells that are not valid targets during a relevant drag
const isInvalidTarget = computed(() => {
  if (activeDragGroup.value === 'group' || activeDragGroup.value === 'judge') {
    return !validTargetClass.value
  }
  return false
})

const liveJudgeInsertIndex = computed(() => {
  if (!isDragOver.value || activeDragGroup.value !== 'judge') return -1
  if (!validTargetClass.value) return -1
  const pointerY = provider.pointer.value?.current.y
  if (pointerY === undefined) return -1
  return getInsertIndex('[data-judge-chip]', pointerY) ?? -1
})
</script>

<template>
  <div
    ref="el"
    class="relative isolate flex flex-col px-2 py-1.5 transition-all"
    :class="[validTargetClass, { 'opacity-50': isInvalidTarget }]"
  >
    <template v-if="assignment">
      <div class="flex flex-col gap-0.5">
        <template v-for="(groupId, index) in assignment.orderedGroupIds" :key="groupId">
          <DragIndicator
            v-if="isDragOver && liveGroupInsertIndex === index"
            variant="group"
            class="-my-0.5 rounded"
          />
          <SpacerChip
            v-if="isPlaceholderId(groupId)"
            :group-id="groupId"
            :index="index"
            :source="location"
            removable
            @remove="
              store.removeGroupFromCell(
                location.blockId,
                location.eventId,
                location.danceId,
                location.platformId,
                groupId,
              )
            "
          />
          <GroupChip
            v-else
            :label="store.getGroupLabel(groupId)"
            :group-id="groupId"
            :index="index"
            :source="location"
            removable
            @remove="
              store.removeGroupFromCell(
                location.blockId,
                location.eventId,
                location.danceId,
                location.platformId,
                groupId,
              )
            "
          />
        </template>
        <DragIndicator
          v-if="isDragOver && liveGroupInsertIndex === (assignment?.orderedGroupIds.length ?? 0)"
          variant="group"
          class="-my-0.5 rounded"
        />
      </div>
      <div class="flex-auto" />
      <div
        v-if="assignment.orderedJudgeIds.length || (isDragOver && liveJudgeInsertIndex >= 0)"
        class="mt-1 flex flex-col gap-0.5"
      >
        <template v-for="(judgeId, index) in assignment.orderedJudgeIds" :key="judgeId">
          <DragIndicator
            v-if="isDragOver && liveJudgeInsertIndex === index"
            variant="judge"
            class="-my-0.5 rounded"
          />
          <JudgeChip
            :label="store.getStaffName(judgeId)"
            :judge-id="judgeId"
            :index="index"
            :source="location"
            removable
            @remove="
              store.removeJudgeFromCell(
                location.blockId,
                location.eventId,
                location.danceId,
                location.platformId,
                judgeId,
              )
            "
          />
        </template>
        <DragIndicator
          v-if="isDragOver && liveJudgeInsertIndex === assignment.orderedJudgeIds.length"
          variant="judge"
          class="-my-0.5 rounded"
        />
      </div>
    </template>
    <template v-else>
      <DragIndicator
        v-if="isDragOver && (liveGroupInsertIndex === 0 || liveJudgeInsertIndex === 0)"
        :variant="activeDragGroup === 'judge' ? 'judge' : 'group'"
        class="-my-0.5 rounded"
      />
      <div
        class="flex flex-auto items-center justify-center rounded border border-dashed border-border px-2 py-1 text-center text-xs text-muted-foreground"
      >
        Drag groups + judges
      </div>
    </template>
  </div>
</template>
