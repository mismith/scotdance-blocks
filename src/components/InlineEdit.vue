<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    selectOnFocus?: boolean
    autoEdit?: boolean
    required?: boolean
    multiline?: boolean
  }>(),
  {
    placeholder: '',
    selectOnFocus: true,
    autoEdit: false,
    required: true,
    multiline: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editing = ref(false)
const draft = ref('')
const inputEl = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
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
  <component
    :is="multiline ? 'textarea' : 'input'"
    v-if="editing"
    ref="inputEl"
    :value="draft"
    :placeholder
    style="line-height: inherit"
    class="block m-0 max-w-full field-sizing-content rounded ring-1 ring-ring bg-card p-0 font-inherit text-inherit outline-none focus:ring-2"
    :class="{ 'resize-none': multiline }"
    @input="draft = ($event.target as HTMLInputElement).value"
    @pointerdown.stop
    @keydown.stop
    @keydown.enter.exact.prevent="commit"
    @keydown.escape="cancel"
    @blur="commit"
  />
  <span
    v-else
    ref="displayEl"
    tabindex="0"
    class="cursor-text border-b border-b-transparent outline-none hover:border-b-muted-foreground focus-visible:border-b-ring"
    :class="{ 'text-current/50': !modelValue, 'whitespace-pre-wrap': multiline }"
    @click.stop="startEdit"
    @keydown.stop
    @keydown.enter.prevent="startEdit"
  >
    {{ modelValue || placeholder }}
  </span>
</template>
