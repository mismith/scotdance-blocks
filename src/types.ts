// === Supporting collections (reference data) ===

export interface Category {
  name: string
}

export interface Group {
  categoryId: string
  name: string // "4 & 5", "8 & 9", "11 & Over", etc.
}

export interface Dance {
  name: string
  shortName: string
  steps?: string // "4", "2&1", "3&1"
  groupIds: Record<string, true> // which groups can perform this dance
}

export interface Platform {
  name: string // "A", "B", "1", "2", etc.
}

export interface StaffMember {
  firstName: string
  lastName: string
  location?: string
  type: string // "Judge", "Piper", etc.
}

// === Schedule (the thing we're building) ===

export interface PlatformAssignment {
  orderedGroupIds: string[]
  orderedJudgeIds: string[]
}

export interface ScheduledDance {
  danceId: string
  name: string // display override or number label
  platforms: Record<string, PlatformAssignment>
}

export interface ScheduleEvent {
  name: string
  description?: string // for non-dance events (e.g. "Primary Demo")
  dances?: Record<string, ScheduledDance>
}

export interface ScheduleBlock {
  name: string // "Morning", "Afternoon"
  events: Record<string, ScheduleEvent>
}

export interface Schedule {
  name: string
  date: string
  blocks: Record<string, ScheduleBlock>
}

// === DnD payload types ===

export interface CellLocation {
  blockId: string
  eventId: string
  danceId: string
  platformId: string
}

export interface DragGroupData {
  type: 'group'
  groupId: string
  index: number
  source: CellLocation | 'palette'
}

export interface DragJudgeData {
  type: 'judge'
  judgeId: string
  index: number
  source: CellLocation | 'palette'
}

export interface DragDanceData {
  type: 'dance'
  scheduledDanceId: string
  index: number
  blockId: string
  eventId: string
}

export interface DragEventData {
  type: 'event'
  eventId: string
  index: number
  blockId: string
}

export interface DragBlockData {
  type: 'block'
  blockId: string
  index: number
}

export type DragItemData = DragGroupData | DragJudgeData

// === Root ===

export interface CompetitionData {
  categories: Record<string, Category>
  groups: Record<string, Group>
  dances: Record<string, Dance>
  platforms: Record<string, Platform>
  staff: Record<string, StaffMember>
  schedule: Schedule
}
