import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import sampleData from '@/data/sample-data.json'
import type { CompetitionData, Dance, Group } from '@/types'

export const useCompetitionStore = defineStore('competition', () => {
  const data = ref<CompetitionData>(sampleData as CompetitionData)

  // --- Getters ---

  const categories = computed(() => data.value.categories)
  const groups = computed(() => data.value.groups)
  const dances = computed(() => data.value.dances)
  const platforms = computed(() => data.value.platforms)
  const staff = computed(() => data.value.staff)
  const schedule = computed(() => data.value.schedule)
  const blocks = computed(() => data.value.schedule.blocks)

  const platformEntries = computed(() => Object.entries(platforms.value))

  const groupsByCategory = computed(() => {
    const map: Record<string, [string, Group][]> = {}
    for (const [id, group] of Object.entries(groups.value)) {
      if (!map[group.categoryId]) map[group.categoryId] = []
      map[group.categoryId].push([id, group])
    }
    return map
  })

  // --- Helpers ---

  function getCategoryName(categoryId: string): string {
    return categories.value[categoryId]?.name ?? categoryId
  }

  function getGroupLabel(groupId: string): string {
    const group = groups.value[groupId]
    if (!group) return groupId
    const category = categories.value[group.categoryId]
    const abbrev = category?.name?.slice(0, 3) ?? ''
    return `${abbrev} ${group.name}`
  }

  function getDance(danceId: string): Dance | undefined {
    return dances.value[danceId]
  }

  function getStaffName(staffId: string): string {
    const member = staff.value[staffId]
    if (!member) return staffId
    return `${member.firstName[0]}. ${member.lastName}`
  }

  // --- Helpers (internal) ---

  function getAssignment(blockId: string, eventId: string, danceId: string, platformId: string) {
    return data.value.schedule.blocks[blockId]?.events[eventId]?.dances?.[danceId]?.platforms[
      platformId
    ]
  }

  function ensureAssignment(blockId: string, eventId: string, danceId: string, platformId: string) {
    const dance = data.value.schedule.blocks[blockId]?.events[eventId]?.dances?.[danceId]
    if (!dance) return undefined
    if (!dance.platforms[platformId]) {
      dance.platforms[platformId] = { orderedGroupIds: [], orderedJudgeIds: [] }
    }
    return dance.platforms[platformId]
  }

  // --- Actions ---

  function loadData(newData: CompetitionData) {
    data.value = newData
  }

  function addGroupToCell(
    blockId: string,
    eventId: string,
    danceId: string,
    platformId: string,
    groupId: string,
    index?: number,
  ) {
    const assignment = ensureAssignment(blockId, eventId, danceId, platformId)
    if (!assignment) return
    // Don't add duplicates
    if (assignment.orderedGroupIds.includes(groupId)) return
    if (index !== undefined) {
      assignment.orderedGroupIds.splice(index, 0, groupId)
    } else {
      assignment.orderedGroupIds.push(groupId)
    }
  }

  function removeGroupFromCell(
    blockId: string,
    eventId: string,
    danceId: string,
    platformId: string,
    groupId: string,
  ) {
    const assignment = getAssignment(blockId, eventId, danceId, platformId)
    if (!assignment) return
    const idx = assignment.orderedGroupIds.indexOf(groupId)
    if (idx !== -1) assignment.orderedGroupIds.splice(idx, 1)
  }

  function moveGroup(
    fromBlockId: string,
    fromEventId: string,
    fromDanceId: string,
    fromPlatformId: string,
    toBlockId: string,
    toEventId: string,
    toDanceId: string,
    toPlatformId: string,
    groupId: string,
    toIndex?: number,
  ) {
    removeGroupFromCell(fromBlockId, fromEventId, fromDanceId, fromPlatformId, groupId)
    addGroupToCell(toBlockId, toEventId, toDanceId, toPlatformId, groupId, toIndex)
  }

  function addJudgeToCell(
    blockId: string,
    eventId: string,
    danceId: string,
    platformId: string,
    judgeId: string,
    index?: number,
  ) {
    const assignment = ensureAssignment(blockId, eventId, danceId, platformId)
    if (!assignment) return
    if (assignment.orderedJudgeIds.includes(judgeId)) return
    if (index !== undefined) {
      assignment.orderedJudgeIds.splice(index, 0, judgeId)
    } else {
      assignment.orderedJudgeIds.push(judgeId)
    }
  }

  function removeJudgeFromCell(
    blockId: string,
    eventId: string,
    danceId: string,
    platformId: string,
    judgeId: string,
  ) {
    const assignment = getAssignment(blockId, eventId, danceId, platformId)
    if (!assignment) return
    const idx = assignment.orderedJudgeIds.indexOf(judgeId)
    if (idx !== -1) assignment.orderedJudgeIds.splice(idx, 1)
  }

  function moveJudge(
    fromBlockId: string,
    fromEventId: string,
    fromDanceId: string,
    fromPlatformId: string,
    toBlockId: string,
    toEventId: string,
    toDanceId: string,
    toPlatformId: string,
    judgeId: string,
  ) {
    removeJudgeFromCell(fromBlockId, fromEventId, fromDanceId, fromPlatformId, judgeId)
    addJudgeToCell(toBlockId, toEventId, toDanceId, toPlatformId, judgeId)
  }

  function reorderJudgeInCell(
    blockId: string,
    eventId: string,
    danceId: string,
    platformId: string,
    fromIndex: number,
    toIndex: number,
  ) {
    const assignment = getAssignment(blockId, eventId, danceId, platformId)
    if (!assignment) return
    const [item] = assignment.orderedJudgeIds.splice(fromIndex, 1)
    assignment.orderedJudgeIds.splice(toIndex, 0, item)
  }

  function reorderGroupInCell(
    blockId: string,
    eventId: string,
    danceId: string,
    platformId: string,
    fromIndex: number,
    toIndex: number,
  ) {
    const assignment = getAssignment(blockId, eventId, danceId, platformId)
    if (!assignment) return
    const [item] = assignment.orderedGroupIds.splice(fromIndex, 1)
    assignment.orderedGroupIds.splice(toIndex, 0, item)
  }

  return {
    data,
    categories,
    groups,
    dances,
    platforms,
    staff,
    schedule,
    blocks,
    platformEntries,
    groupsByCategory,
    getCategoryName,
    getGroupLabel,
    getDance,
    getStaffName,
    loadData,
    addGroupToCell,
    removeGroupFromCell,
    moveGroup,
    addJudgeToCell,
    removeJudgeFromCell,
    moveJudge,
    reorderGroupInCell,
    reorderJudgeInCell,
  }
})
