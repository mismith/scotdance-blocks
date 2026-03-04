import { useCompetitionStore } from '@/stores/competition'

export function useAutoFill() {
  const store = useCompetitionStore()

  /**
   * Add reference dances to the event that aren't already scheduled.
   * Preserves palette insertion order; purely additive (no clearing).
   *
   * When categoryFilter is provided, only places dances that have at least
   * one eligible group in those categories (unrestricted dances always included).
   */
  function autoPlaceDances(blockId: string, eventId: string, categoryFilter?: Set<string>) {
    const event = store.blocks[blockId]?.events[eventId]
    if (!event) return

    const alreadyPlaced = new Set(
      Object.values(event.dances ?? {}).map((sd) => sd.danceId),
    )

    // When filtering by category, build set of eligible group IDs
    const filterGroupIds = categoryFilter
      ? new Set(
          Object.entries(store.groups)
            .filter(([, group]) => categoryFilter.has(group.categoryId))
            .map(([id]) => id),
        )
      : undefined

    for (const [danceId, dance] of Object.entries(store.dances)) {
      if (alreadyPlaced.has(danceId)) continue

      if (filterGroupIds) {
        const danceGroupIds = Object.keys(dance.groupIds)
        const hasRestrictions = danceGroupIds.length > 0
        const isRelevant = hasRestrictions
          ? danceGroupIds.some((gId) => filterGroupIds.has(gId))
          : true // unrestricted dances are always relevant
        if (!isRelevant) continue
      }

      store.addDanceToEvent(blockId, eventId, danceId)
    }
  }

  /**
   * Clear and repopulate group assignments for all dances in the event.
   * Distributes eligible groups across platforms via round-robin,
   * maintaining youngest-to-oldest order within each platform.
   *
   * When categoryFilter is provided, only groups belonging to those
   * categories are assigned (used by autoFillSchedule for per-block splits).
   */
  function autoFillGroups(
    blockId: string,
    eventId: string,
    categoryFilter?: Set<string>,
  ) {
    const event = store.blocks[blockId]?.events[eventId]
    if (!event?.dances) return

    const platformIds = Object.keys(store.platforms)
    if (!platformIds.length) return

    // When filtering by category, only include groups from those categories
    const allGroupIds = categoryFilter
      ? Object.entries(store.groups)
          .filter(([, group]) => categoryFilter.has(group.categoryId))
          .map(([id]) => id)
      : Object.keys(store.groups)

    // Clear existing group assignments
    for (const [sdId, scheduledDance] of Object.entries(event.dances)) {
      for (const platformId of platformIds) {
        const assignment = scheduledDance.platforms[platformId]
        if (!assignment) continue
        for (const groupId of [...assignment.orderedGroupIds]) {
          store.removeGroupFromCell(blockId, eventId, sdId, platformId, groupId)
        }
      }
    }

    // Fill each dance with eligible groups via round-robin
    for (const [sdId, scheduledDance] of Object.entries(event.dances)) {
      if (!scheduledDance.danceId) continue
      const dance = store.getDance(scheduledDance.danceId)
      if (!dance) continue

      const hasRestrictions = Object.keys(dance.groupIds).length > 0
      const eligibleGroupIds = hasRestrictions
        ? allGroupIds.filter((gId) => dance.groupIds[gId])
        : allGroupIds

      for (let i = 0; i < eligibleGroupIds.length; i++) {
        const platformId = platformIds[i % platformIds.length]
        store.addGroupToCell(blockId, eventId, sdId, platformId, eligibleGroupIds[i])
      }
    }
  }

  /**
   * Clear and repopulate judge assignments with a rotation pattern.
   * Judges sorted alphabetically, one per platform, rotating right each dance row.
   */
  function autoCycleJudges(blockId: string, eventId: string) {
    const event = store.blocks[blockId]?.events[eventId]
    if (!event?.dances) return

    const platformIds = Object.keys(store.platforms)
    if (!platformIds.length) return

    // Only assign staff with type "Judge"
    const judgeIds = Object.entries(store.staff)
      .filter(([, member]) => member.type === 'Judge')
      .sort(([, a], [, b]) => {
        const last = a.lastName.localeCompare(b.lastName)
        return last !== 0 ? last : a.firstName.localeCompare(b.firstName)
      })
      .map(([id]) => id)

    if (!judgeIds.length) return

    // Clear existing judge assignments
    for (const [sdId, scheduledDance] of Object.entries(event.dances)) {
      for (const platformId of platformIds) {
        const assignment = scheduledDance.platforms[platformId]
        if (!assignment) continue
        for (const judgeId of [...assignment.orderedJudgeIds]) {
          store.removeJudgeFromCell(blockId, eventId, sdId, platformId, judgeId)
        }
      }
    }

    // Assign with rotation: each dance row shifts right by 1
    const numJudges = judgeIds.length
    const danceEntries = Object.entries(event.dances)

    for (let danceIndex = 0; danceIndex < danceEntries.length; danceIndex++) {
      const [sdId, scheduledDance] = danceEntries[danceIndex]
      if (!scheduledDance.danceId) continue // skip freeform rows
      for (let pIdx = 0; pIdx < platformIds.length; pIdx++) {
        if (pIdx >= numJudges) break // more platforms than judges
        const judgeIndex = ((pIdx - danceIndex) % numJudges + numJudges) % numJudges
        store.addJudgeToCell(blockId, eventId, sdId, platformIds[pIdx], judgeIds[judgeIndex])
      }
    }
  }

  /**
   * Scaffold the entire schedule: split categories into 2 blocks,
   * create events, place dances, fill groups, and cycle judges.
   * Returns the first blockId for tab auto-selection.
   */
  function autoFillSchedule(): string | undefined {
    const categoryIds = Object.keys(store.categories)
    if (!categoryIds.length) return undefined

    // Clear existing blocks
    for (const blockId of Object.keys(store.blocks)) {
      store.removeBlock(blockId)
    }

    // Split categories in half: younger → Morning, older → Afternoon
    const midpoint = Math.ceil(categoryIds.length / 2)
    const halves = [
      { name: 'Morning', categoryIds: categoryIds.slice(0, midpoint), time: '9:00 AM' },
      { name: 'Afternoon', categoryIds: categoryIds.slice(midpoint), time: '1:00 PM' },
    ]

    let firstBlockId: string | undefined

    for (const half of halves) {
      const categorySet = new Set(half.categoryIds)

      // Build event name from category names
      const eventName = half.categoryIds
        .map((id) => store.categories[id]?.name ?? id)
        .join(' / ')

      const blockId = store.addBlock(half.name)
      if (!firstBlockId) firstBlockId = blockId

      // Registration event with time placeholder
      const regEventId = store.addEvent(blockId, 'Registration')
      store.updateEventDescription(blockId, regEventId, half.time)

      // Dance event
      const danceEventId = store.addEvent(blockId, eventName)
      autoPlaceDances(blockId, danceEventId, categorySet)
      autoFillGroups(blockId, danceEventId, categorySet)
      autoCycleJudges(blockId, danceEventId)

      // Results event
      store.addEvent(blockId, 'Results')
    }

    return firstBlockId
  }

  return { autoPlaceDances, autoFillGroups, autoCycleJudges, autoFillSchedule }
}
