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

async function startEdit() {
  draft.value = props.modelValue
  editing.value = true
  await nextTick()
  inputEl.value?.focus()
  if (props.selectOnFocus) {
    inputEl.value?.select()
  }
}

function commit() {
  editing.value = false
  const trimmed = draft.value.trim()
  if (props.required && !trimmed) return
  if (trimmed !== props.modelValue) {
    emit('update:modelValue', trimmed)
  }
}

function cancel() {
  editing.value = false
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
    class="field-sizing-content rounded border border-blue-300 bg-white px-1 py-0 text-inherit leading-tight outline-none focus:ring-1 focus:ring-blue-400"
    @pointerdown.stop
    @keydown.stop
    @keydown.enter="commit"
    @keydown.escape="cancel"
    @blur="commit"
  />
  <component
    :is="tag"
    v-else
    class="cursor-text border-b border-transparent hover:border-gray-400"
    :class="{ 'italic text-gray-400': !modelValue }"
    @click.stop="startEdit"
  >
    {{ modelValue || placeholder }}
  </component>
</template>
