<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    tag?: string
    placeholder?: string
    selectOnFocus?: boolean
    autoEdit?: boolean
    required?: boolean
  }>(),
  {
    tag: 'span',
    placeholder: '',
    selectOnFocus: true,
    autoEdit: false,
    required: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editing = ref(false)
const draft = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const displayEl = ref<HTMLElement | null>(null)

async function startEdit() {
  draft.value = props.modelValue
  editing.value = true
  await nextTick()
  inputEl.value?.focus()
  if (props.selectOnFocus) {
    inputEl.value?.select()
  }
}

async function focusDisplay() {
  await nextTick()
  displayEl.value?.focus()
}

function commit() {
  editing.value = false
  const trimmed = draft.value.trim()
  if (props.required && !trimmed) {
    focusDisplay()
    return
  }
  if (trimmed !== props.modelValue) {
    emit('update:modelValue', trimmed)
  }
  focusDisplay()
}

function cancel() {
  editing.value = false
  focusDisplay()
}

onMounted(() => {
  if (props.autoEdit) startEdit()
})
</script>

<template>
  <input
    v-if="editing"
    ref="inputEl"
    v-model="draft"
    :placeholder
    class="field-sizing-content rounded border border-ring bg-card px-0 py-0 text-inherit leading-tight outline-none focus:ring-1 focus:ring-ring"
    @pointerdown.stop
    @keydown.stop
    @keydown.enter="commit"
    @keydown.escape="cancel"
    @blur="commit"
  />
  <component
    :is="tag"
    v-else
    ref="displayEl"
    tabindex="0"
    class="cursor-text border-b border-b-transparent outline-none hover:border-b-muted-foreground focus-visible:border-b-ring"
    :class="{ 'text-current/50': !modelValue }"
    @click.stop="startEdit"
    @keydown.stop
    @keydown.enter.prevent="startEdit"
  >
    {{ modelValue || placeholder }}
  </component>
</template>
