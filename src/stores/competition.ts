import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { generateId } from '@/utils/id'
import type { CompetitionData, Dance, Group } from '@/types'

export function createEmptyData(): CompetitionData {
  return {
    categories: {},
    groups: {},
    dances: {},
    platforms: {},
    staff: {},
    schedule: { name: '', date: '', blocks: {} },
  }
}

export const useCompetitionStore = defineStore('competition', () => {
  const data = ref<CompetitionData>(createEmptyData())
  const collectionsReadonly = ref(false)

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

  function getGroupLabel(groupId: string, { abbreviate = true } = {}): string {
    const group = groups.value[groupId]
    if (!group) return groupId
    const category = categories.value[group.categoryId]
    const catName = abbreviate ? (category?.name?.slice(0, 3) ?? '') : (category?.name ?? '')
    return `${catName} ${group.name}`
  }

  function getDance(danceId: string): Dance | undefined {
    return dances.value[danceId]
  }

  const staffDisplayNames = computed(() => {
    const entries = Object.entries(staff.value)
    const names: Record<string, string> = {}

    // Group by last name
    const byLastName: Record<string, [string, (typeof entries)[number][1]][]> = {}
    for (const [id, member] of entries) {
      if (!byLastName[member.lastName]) byLastName[member.lastName] = []
      byLastName[member.lastName].push([id, member])
    }

    for (const group of Object.values(byLastName)) {
      if (group.length === 1) {
        // Unique last name
        names[group[0][0]] = group[0][1].lastName
      } else {
        // Duplicate last names — try first initial
        const byInitial: Record<string, typeof group> = {}
        for (const entry of group) {
          const key = `${entry[1].firstName[0]}. ${entry[1].lastName}`
          if (!byInitial[key]) byInitial[key] = []
          byInitial[key].push(entry)
        }
        for (const initialGroup of Object.values(byInitial)) {
          if (initialGroup.length === 1) {
            const [id, member] = initialGroup[0]
            names[id] = `${member.firstName[0]}. ${member.lastName}`
          } else {
            // Still duplicate — use full name
            for (const [id, member] of initialGroup) {
              names[id] = `${member.firstName} ${member.lastName}`
            }
          }
        }
      }
    }

    return names
  })

  function getStaffName(staffId: string): string {
    return staffDisplayNames.value[staffId] ?? staffId
  }

  // --- Helpers (internal) ---

  function reorderRecord<T>(
    record: Record<string, T>,
    fromIndex: number,
    toIndex: number,
  ): Record<string, T> {
    const entries = Object.entries(record)
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return record
    if (fromIndex >= entries.length || toIndex >= entries.length) return record
    const [moved] = entries.splice(fromIndex, 1)
    entries.splice(toIndex, 0, moved)
    return Object.fromEntries(entries)
  }

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

  // --- Reference data CRUD ---

  function addCategory(name?: string): string {
    const id = generateId()
    data.value.categories[id] = { name: name ?? 'New Category' }
    return id
  }

  function removeCategory(categoryId: string) {
    delete data.value.categories[categoryId]
    // Remove all groups in this category (and their assignments)
    for (const [groupId, group] of Object.entries(data.value.groups)) {
      if (group.categoryId === categoryId) removeGroup(groupId)
    }
  }

  function renameCategory(categoryId: string, name: string) {
    const category = data.value.categories[categoryId]
    if (category) category.name = name
  }

  function addDance(name?: string): string {
    const id = generateId()
    data.value.dances[id] = { name: name ?? 'New Dance', shortName: '', groupIds: {} }
    return id
  }

  function addDanceFromPreset(preset: {
    name: string
    shortName?: string
    steps?: string
  }): string {
    const id = generateId()
    data.value.dances[id] = {
      name: preset.name,
      shortName: preset.shortName ?? '',
      steps: preset.steps,
      groupIds: {},
    }
    return id
  }

  function removeDance(danceId: string) {
    delete data.value.dances[danceId]
    for (const block of Object.values(data.value.schedule.blocks)) {
      for (const event of Object.values(block.events)) {
        if (!event.dances) continue
        for (const [sdId, sd] of Object.entries(event.dances)) {
          if (sd.danceId === danceId) delete event.dances[sdId]
        }
      }
    }
  }

  function updateDance(
    danceId: string,
    fields: Partial<Pick<Dance, 'name' | 'shortName' | 'steps'>>,
  ) {
    const dance = data.value.dances[danceId]
    if (!dance) return
    if (fields.name !== undefined) dance.name = fields.name
    if (fields.shortName !== undefined) dance.shortName = fields.shortName
    if (fields.steps !== undefined) dance.steps = fields.steps || undefined
  }

  function toggleDanceGroup(danceId: string, groupId: string) {
    const dance = data.value.dances[danceId]
    if (!dance) return
    if (dance.groupIds[groupId]) delete dance.groupIds[groupId]
    else dance.groupIds[groupId] = true
  }

  function toggleDanceCategoryGroups(danceId: string, categoryId: string) {
    const dance = data.value.dances[danceId]
    if (!dance) return
    const catGroups = groupsByCategory.value[categoryId] ?? []
    const allChecked = catGroups.every(([gId]) => dance.groupIds[gId])
    for (const [gId] of catGroups) {
      if (allChecked) delete dance.groupIds[gId]
      else dance.groupIds[gId] = true
    }
  }

  function addGroup(categoryId: string, name?: string): string {
    const id = generateId()
    data.value.groups[id] = { categoryId, name: name ?? 'New Group' }
    return id
  }

  function removeGroup(groupId: string) {
    delete data.value.groups[groupId]
    for (const dance of Object.values(data.value.dances)) {
      delete dance.groupIds[groupId]
    }
    for (const block of Object.values(data.value.schedule.blocks)) {
      for (const event of Object.values(block.events)) {
        if (!event.dances) continue
        for (const sd of Object.values(event.dances)) {
          for (const assignment of Object.values(sd.platforms)) {
            const idx = assignment.orderedGroupIds.indexOf(groupId)
            if (idx !== -1) assignment.orderedGroupIds.splice(idx, 1)
          }
        }
      }
    }
  }

  function renameGroup(groupId: string, name: string) {
    const group = data.value.groups[groupId]
    if (group) group.name = name
  }

  function addStaffMember(): string {
    const id = generateId()
    data.value.staff[id] = { firstName: 'New', lastName: 'Judge', type: 'Judge' }
    return id
  }

  function removeStaffMember(staffId: string) {
    delete data.value.staff[staffId]
    for (const block of Object.values(data.value.schedule.blocks)) {
      for (const event of Object.values(block.events)) {
        if (!event.dances) continue
        for (const sd of Object.values(event.dances)) {
          for (const assignment of Object.values(sd.platforms)) {
            const idx = assignment.orderedJudgeIds.indexOf(staffId)
            if (idx !== -1) assignment.orderedJudgeIds.splice(idx, 1)
          }
        }
      }
    }
  }

  function renameStaffMember(staffId: string, firstName: string, lastName: string) {
    const member = data.value.staff[staffId]
    if (!member) return
    member.firstName = firstName
    member.lastName = lastName
  }

  // --- Structural CRUD ---

  function addBlock(name?: string): string {
    const id = generateId()
    data.value.schedule.blocks[id] = { name: name ?? 'New Block', events: {} }
    return id
  }

  function removeBlock(blockId: string) {
    delete data.value.schedule.blocks[blockId]
  }

  function renameBlock(blockId: string, name: string) {
    const block = data.value.schedule.blocks[blockId]
    if (block) block.name = name
  }

  function updateBlockDescription(blockId: string, description: string) {
    const block = data.value.schedule.blocks[blockId]
    if (block) block.description = description || undefined
  }

  function addEvent(blockId: string, name?: string): string {
    const id = generateId()
    const block = data.value.schedule.blocks[blockId]
    if (block) {
      block.events[id] = { name: name ?? 'New Event', dances: {} }
    }
    return id
  }

  function removeEvent(blockId: string, eventId: string) {
    const block = data.value.schedule.blocks[blockId]
    if (block) delete block.events[eventId]
  }

  function renameEvent(blockId: string, eventId: string, name: string) {
    const event = data.value.schedule.blocks[blockId]?.events[eventId]
    if (event) event.name = name
  }

  function updateEventDescription(blockId: string, eventId: string, description: string) {
    const event = data.value.schedule.blocks[blockId]?.events[eventId]
    if (event) event.description = description
  }

  function addDanceToEvent(
    blockId: string,
    eventId: string,
    danceId?: string,
    name?: string,
    insertIndex?: number,
  ): string {
    const id = generateId()
    const event = data.value.schedule.blocks[blockId]?.events[eventId]
    if (event) {
      if (!event.dances) event.dances = {}
      const newDance: { danceId?: string; name: string; platforms: Record<string, never> } = {
        name: name ?? '',
        platforms: {},
      }
      if (danceId) newDance.danceId = danceId
      if (insertIndex !== undefined) {
        const entries = Object.entries(event.dances)
        entries.splice(insertIndex, 0, [id, newDance])
        event.dances = Object.fromEntries(entries)
      } else {
        event.dances[id] = newDance
      }
    }
    return id
  }

  function updateScheduledDanceName(
    blockId: string,
    eventId: string,
    scheduledDanceId: string,
    name: string,
  ) {
    const dance = data.value.schedule.blocks[blockId]?.events[eventId]?.dances?.[scheduledDanceId]
    if (dance) dance.name = name
  }

  function updateScheduledDanceDescription(
    blockId: string,
    eventId: string,
    scheduledDanceId: string,
    description: string,
  ) {
    const dance = data.value.schedule.blocks[blockId]?.events[eventId]?.dances?.[scheduledDanceId]
    if (dance) dance.description = description || undefined
  }

  function moveDance(
    fromBlockId: string,
    fromEventId: string,
    fromScheduledDanceId: string,
    toBlockId: string,
    toEventId: string,
    toIndex?: number,
  ) {
    const fromEvent = data.value.schedule.blocks[fromBlockId]?.events[fromEventId]
    const toEvent = data.value.schedule.blocks[toBlockId]?.events[toEventId]
    if (!fromEvent?.dances?.[fromScheduledDanceId] || !toEvent) return

    const scheduledDance = fromEvent.dances[fromScheduledDanceId]
    delete fromEvent.dances[fromScheduledDanceId]

    if (!toEvent.dances) toEvent.dances = {}
    if (toIndex !== undefined) {
      const entries = Object.entries(toEvent.dances)
      entries.splice(toIndex, 0, [fromScheduledDanceId, scheduledDance])
      toEvent.dances = Object.fromEntries(entries)
    } else {
      toEvent.dances[fromScheduledDanceId] = scheduledDance
    }
  }

  function removeDanceFromEvent(blockId: string, eventId: string, scheduledDanceId: string) {
    const event = data.value.schedule.blocks[blockId]?.events[eventId]
    if (event?.dances) delete event.dances[scheduledDanceId]
  }

  function addPlatform(name?: string): string {
    const id = generateId()
    const existingCount = Object.keys(data.value.platforms).length
    data.value.platforms[id] = {
      name: name ?? `Platform ${String.fromCharCode(65 + existingCount)}`,
    }
    return id
  }

  function removePlatform(platformId: string) {
    delete data.value.platforms[platformId]
    // Clean up orphaned assignments in all dances
    for (const block of Object.values(data.value.schedule.blocks)) {
      for (const event of Object.values(block.events)) {
        if (!event.dances) continue
        for (const dance of Object.values(event.dances)) {
          delete dance.platforms[platformId]
        }
      }
    }
  }

  function renamePlatform(platformId: string, name: string) {
    const platform = data.value.platforms[platformId]
    if (platform) platform.name = name
  }

  // --- Reorder ---

  function reorderPlatform(fromIndex: number, toIndex: number) {
    data.value.platforms = reorderRecord(data.value.platforms, fromIndex, toIndex)
  }

  function reorderBlock(fromIndex: number, toIndex: number) {
    data.value.schedule.blocks = reorderRecord(data.value.schedule.blocks, fromIndex, toIndex)
  }

  function reorderEvent(blockId: string, fromIndex: number, toIndex: number) {
    const block = data.value.schedule.blocks[blockId]
    if (block) block.events = reorderRecord(block.events, fromIndex, toIndex)
  }

  function reorderDance(blockId: string, eventId: string, fromIndex: number, toIndex: number) {
    const event = data.value.schedule.blocks[blockId]?.events[eventId]
    if (event?.dances) event.dances = reorderRecord(event.dances, fromIndex, toIndex)
  }

  return {
    data,
    collectionsReadonly,
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
    addCategory,
    removeCategory,
    renameCategory,
    addDance,
    addDanceFromPreset,
    removeDance,
    updateDance,
    toggleDanceGroup,
    toggleDanceCategoryGroups,
    addGroup,
    removeGroup,
    renameGroup,
    addStaffMember,
    removeStaffMember,
    renameStaffMember,
    loadData,
    addGroupToCell,
    removeGroupFromCell,
    moveGroup,
    addJudgeToCell,
    removeJudgeFromCell,
    moveJudge,
    reorderGroupInCell,
    reorderJudgeInCell,
    addBlock,
    removeBlock,
    renameBlock,
    updateBlockDescription,
    addEvent,
    removeEvent,
    renameEvent,
    updateEventDescription,
    addDanceToEvent,
    updateScheduledDanceName,
    updateScheduledDanceDescription,
    moveDance,
    removeDanceFromEvent,
    addPlatform,
    removePlatform,
    renamePlatform,
    reorderPlatform,
    reorderBlock,
    reorderEvent,
    reorderDance,
  }
})
