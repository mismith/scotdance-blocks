import { useDnDProvider } from '@vue-dnd-kit/core'
import { computed } from 'vue'

/**
 * Returns the DnD group of the currently dragged item (e.g. 'group', 'judge', 'dance', 'event', 'block'),
 * or null if nothing is being dragged.
 */
export function useDragType() {
  const provider = useDnDProvider()

  const activeDragGroup = computed(() => {
    if (provider.state.value !== 'dragging') return null
    const el = provider.entities.initiatingDraggable
    if (!el) return null
    const entity = provider.entities.draggableMap.get(el)
    return entity?.groups?.[0] ?? null
  })

  return { provider, activeDragGroup }
}
