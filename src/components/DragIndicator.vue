<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
  variant?: 'dance' | 'group' | 'judge'
}>(), {
  orientation: 'horizontal',
})

const indicatorStyle = computed(() => {
  const color = {
    dance: 'var(--dance-foreground)',
    group: 'var(--group-foreground)',
    judge: 'var(--judge-foreground)',
  }[props.variant!]
  return color ? { '--indicator': color } : undefined
})
</script>

<template>
  <div
    class="relative z-10 bg-indicator"
    :class="orientation === 'vertical' ? 'w-0.5' : 'h-0.5'"
    :style="indicatorStyle"
  >
    <div
      class="absolute size-2 rounded-full border-2 border-indicator bg-background"
      :class="orientation === 'vertical'
        ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
        : 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'"
    />
  </div>
</template>
