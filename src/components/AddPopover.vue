<script setup lang="ts">
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/vue'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'

export type AddPopoverItem = {
  key: string
  label: string
  sublabel?: string
}

const props = withDefaults(
  defineProps<{
    anchor: HTMLElement | null
    open: boolean
    align?: 'left' | 'right'
    items: AddPopoverItem[]
    placeholder?: string
    popoverClass?: string
  }>(),
  { align: 'left', placeholder: 'Type new name...' },
)

const emit = defineEmits<{
  close: []
  select: [item: AddPopoverItem]
  add: [text: string]
}>()

const anchorRef = computed(() => props.anchor)
const floatingEl = ref<HTMLElement | null>(null)

const placement = computed<'bottom-start' | 'bottom-end'>(() =>
  props.align === 'right' ? 'bottom-end' : 'bottom-start',
)

const { floatingStyles } = useFloating(anchorRef, floatingEl, {
  placement,
  middleware: [
    offset(({ rects }) => -rects.reference.height),
    size({
      apply({ rects, elements }) {
        Object.assign(elements.floating.style, {
          minWidth: `${rects.reference.width}px`,
        })
      },
    }),
    flip(),
    shift(),
  ],
  whileElementsMounted: autoUpdate,
})

const search = ref('')
const highlightIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

const filteredItems = computed(() => {
  if (!search.value) return props.items
  const q = search.value.toLowerCase()
  return props.items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      (item.sublabel && item.sublabel.toLowerCase().includes(q)),
  )
})

const showAddOption = computed(() => search.value.trim().length > 0)

const totalOptions = computed(() => filteredItems.value.length + (showAddOption.value ? 1 : 0))

watch(
  () => search.value,
  () => {
    highlightIndex.value = 0
  },
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      search.value = ''
      highlightIndex.value = 0
      nextTick(() => inputEl.value?.focus())
    }
  },
)

function onConfirm() {
  if (totalOptions.value === 0) return

  const idx = highlightIndex.value
  if (idx < filteredItems.value.length) {
    const item = filteredItems.value[idx]
    emit('select', item)
    search.value = ''
  } else if (showAddOption.value) {
    emit('add', search.value.trim())
    search.value = ''
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return

  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (totalOptions.value > 0) {
      highlightIndex.value = (highlightIndex.value + 1) % totalOptions.value
    }
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (totalOptions.value > 0) {
      highlightIndex.value = (highlightIndex.value - 1 + totalOptions.value) % totalOptions.value
    }
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    onConfirm()
  }
}

function onSelectItem(item: AddPopoverItem) {
  emit('select', item)
  search.value = ''
  nextTick(() => inputEl.value?.focus())
}

function onAddCustom() {
  if (!search.value.trim()) return
  emit('add', search.value.trim())
  search.value = ''
  nextTick(() => inputEl.value?.focus())
}

useEventListener(document, 'keydown', onKeydown)
</script>

<template>
  <Teleport to="body">
    <template v-if="open">
      <div class="fixed inset-0 z-40" @click="emit('close')" />
      <div
        ref="floatingEl"
        class="z-50 min-w-48 overflow-hidden rounded-lg shadow-lg"
        :class="popoverClass || 'border border-border bg-card'"
        :style="floatingStyles"
      >
        <div class="flex items-center">
          <input
            ref="inputEl"
            v-model="search"
            class="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm font-medium leading-5 outline-none placeholder:text-muted-foreground/50"
            :placeholder="placeholder"
          />
          <button
            class="flex shrink-0 items-center justify-center rounded px-2 opacity-50 outline-none hover:opacity-75 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
            title="Close"
            @click="emit('close')"
            @mousedown.prevent
          >
            &times;
          </button>
        </div>
        <div class="max-h-64 overflow-y-auto p-1">
          <button
            v-for="(item, index) in filteredItems"
            :key="item.key"
            class="flex w-full items-center rounded px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="highlightIndex === index ? 'bg-white/10' : 'hover:bg-white/10'"
            @click="onSelectItem(item)"
            @mouseenter="highlightIndex = index"
          >
            {{ item.label
            }}<span v-if="item.sublabel" class="ml-1 text-muted-foreground">{{
              item.sublabel
            }}</span>
          </button>
          <button
            v-if="showAddOption"
            class="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="highlightIndex === filteredItems.length ? 'bg-white/10' : 'hover:bg-white/10'"
            @click="onAddCustom"
            @mouseenter="highlightIndex = filteredItems.length"
          >
            <span class="mr-1">+</span> Add "{{ search.trim() }}"
          </button>
          <div
            v-if="filteredItems.length === 0 && !showAddOption"
            class="px-2 py-1.5 text-sm text-muted-foreground"
          >
            No items. Type to add a new one.
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>
