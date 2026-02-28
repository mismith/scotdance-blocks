import { useDnDProvider } from '@vue-dnd-kit/core'
import { computed } from 'vue'

import type { DragData } from '@/types'

/**
 * Returns the DnD group of the currently dragged item (e.g. 'group', 'judge', 'dance', 'event', 'block'),
 * or null if nothing is being dragged. Also exposes the drag payload for filtering logic.
 */
export function useDragType() {
  const provider = useDnDProvider()

  const activeDragEntity = computed(() => {
    if (provider.state.value !== 'dragging') return null
    const el = provider.entities.initiatingDraggable
    if (!el) return null
    return provider.entities.draggableMap.get(el) ?? null
  })

  const activeDragGroup = computed(() => activeDragEntity.value?.groups?.[0] ?? null)

  const activeDragPayload = computed<DragData | null>(() => {
    const entity = activeDragEntity.value
    if (!entity?.payload) return null
    const [, items] = entity.payload()
    return (items[0] as DragData) ?? null
  })

  return { provider, activeDragGroup, activeDragPayload }
}
