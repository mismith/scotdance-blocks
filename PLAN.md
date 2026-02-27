# ScotDance Blocks — Schedule Builder Plan

## Context

Highland dancing competitions use "platform schedules" — grid-style timetables showing which dances happen on which stage, judged by whom, for which age groups. These are currently built manually (or via scotdance.app's non-intuitive UI). This app replaces that with a drag-and-drop WYSIWYG builder that feels like a friendlier, blockier Excel — approachable for the non-techy highland dance community.

## Principles

- **Blocks mental model**: Everything is a draggable "block" (Lego brick) — judges, groups, dances, platforms
- **Grid-native**: The schedule *is* the grid. No separate "edit mode" — what you see is what you get
- **Progressive disclosure**: Start simple (blocks → events → dances), reveal complexity as needed
- **Familiar**: Looks like the printed schedules people already know (see `docs/examples/`)
- **UI-first**: Build the interaction model before worrying about persistence

## Tech Stack

- **Vue 3** + TypeScript + Pinia
- **Tailwind CSS 4**
- **vue-dnd-kit** (`@vue-dnd-kit/core`) — Vue 3-native DnD, good accessibility, lightweight
- **Persistence**: Deferred (start with in-memory + JSON import/export)

## Data Model

See `src/types.ts` for full TypeScript definitions. Key concepts:

- **Categories**: Primary, Beginner, Novice, Intermediate, Premier
- **Groups**: Age ranges within categories (e.g. "4 & 5", "8 & 9", "11 & Over")
- **Dances**: Highland Fling, Sword Dance, Seann Truibhas, etc. — each with applicable groups
- **Platforms**: Stages (A, B, C, or 1-9) where dancing happens simultaneously
- **Staff**: Judges assigned to platforms
- **Schedule**: Nested tree of Blocks → Events → Scheduled Dances → Platform Assignments

```
Schedule
└── Blocks ("Morning", "Afternoon")
    └── Events ("Pre-Premier Dances", "Primary Demo")
        └── Scheduled Dances (Fling, Sword, ST...)
            └── Platform Assignments
                ├── orderedGroupIds (which age groups on this platform)
                └── orderedJudgeIds (which judges on this platform)
```

The `Record<string, true>` pattern for `groupIds` on dances comes from Firebase/scotdance.app. We preserve this shape for import/export compatibility.

## Component Architecture

```
App.vue
├── AppHeader.vue
│   └── Competition name, import/export buttons, view toggle
│
├── ScheduleBuilder.vue (main workspace)
│   ├── BlockTabs.vue
│   │   └── Tab per block (Morning/Afternoon/...), + add block
│   │
│   ├── ScheduleGrid.vue (the core — a table/grid)
│   │   ├── PlatformHeaders.vue (column headers)
│   │   ├── EventSection.vue (repeated per event)
│   │   │   ├── EventHeader.vue (event name, inline editable)
│   │   │   ├── DanceRow.vue (repeated per dance)
│   │   │   │   ├── DanceLabel.vue (left column: dance name + steps)
│   │   │   │   └── PlatformCell.vue (per platform column — drop zone)
│   │   │   │       ├── GroupChip.vue (draggable group block)
│   │   │   │       └── JudgeChip.vue (draggable judge block)
│   │   │   └── AddDanceButton.vue
│   │   └── AddEventButton.vue
│   │
│   └── Sidebar.vue (block palette — draggable sources)
│       ├── PlatformPalette.vue
│       ├── DancePalette.vue
│       ├── GroupPalette.vue
│       └── JudgePalette.vue
```

### Layout concept

```
┌─────────────────────────────────────────────────────┐
│  AppHeader: [ScotDance Blocks]  [Import] [Export]   │
├──────────┬──────────────────────────────────┬───────┤
│          │  [Morning] [Afternoon] [+]       │       │
│          ├──────────────────────────────────┤       │
│          │   Platform A  │  Platform B  │...│       │
│  Groups  ├──────────────────────────────────┤ Dances│
│  palette │  Fling (4)   │ Beg 7  │ Nov 9&U │palette│
│          │              │ Beg 8&9│ Nov 10  │       │
│ (drag    │   Judge: Doe │  Doe   │  Doe    │(drag  │
│  from    ├──────────────────────────────────┤ from  │
│  here)   │  Sword (2+1) │ ...   │ ...     │ here) │
│          ├──────────────────────────────────┤       │
│          │         Judges palette           │       │
└──────────┴──────────────────────────────────┴───────┘
```

## Drag-and-Drop Interactions

| Source | Target | Action |
|--------|--------|--------|
| Group from palette | PlatformCell | Add group to that platform's assignment |
| Judge from palette | PlatformCell | Assign judge to that platform |
| Dance from palette | EventSection | Add dance row to that event |
| GroupChip in cell | Another PlatformCell | Move group between platforms |
| GroupChip in cell | Reorder within cell | Reorder groups on that platform |
| JudgeChip in cell | Another PlatformCell | Move judge between platforms |
| DanceRow | Reorder within event | Reorder dances |
| EventSection | Reorder within block | Reorder events |

## Phased Build Order

### Phase 0: Project Setup & Documentation
- [x] Create `PLAN.md` in project root
- [ ] Save example schedule images to `docs/examples/`
- [x] Organize sample data into `docs/` and `src/data/`
- [x] Update README.md

### Phase 1: Static Grid Rendering
- [ ] Define TypeScript types in `src/types.ts`
- [ ] Create `useCompetitionStore` with sample data as initial state
- [ ] Build grid components: ScheduleGrid, EventSection, DanceRow, PlatformCell
- [ ] Render sample data as a readable grid (read-only)
- [ ] Basic Tailwind styling

### Phase 2: Block Palettes + Drag-and-Drop
- [ ] Install `@vue-dnd-kit/core`
- [ ] Build sidebar palettes (groups, dances, judges)
- [ ] Drag from palette → drop into grid cells
- [ ] Drag to reorder within cells
- [ ] Drag between cells (move group/judge to different platform)

### Phase 3: Inline Editing + CRUD
- [ ] Click-to-edit for event/block names
- [ ] Add/remove blocks, events, dances
- [ ] Add/remove platforms (columns)
- [ ] Manage supporting data (judges, groups, categories)

### Phase 4: Views, Print, Polish
- [ ] Compact vs expanded view toggle
- [ ] Print-friendly layout
- [ ] Visual polish: transitions, hover states, empty states
- [ ] Keyboard accessibility

### Phase 5: Import/Export + Persistence (future)
- [ ] JSON export (scotdance.app compatible)
- [ ] JSON import
- [ ] Backend persistence (Firebase or Cloudflare D1 — TBD)
- [ ] Auth
