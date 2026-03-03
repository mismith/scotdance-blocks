<script setup lang="ts">
withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
}>(), {
  orientation: 'horizontal',
})
</script>

<template>
  <div
    class="relative z-10 bg-indicator outline-1 outline-offset-0 outline-background"
    :class="orientation === 'vertical' ? 'w-0.5' : 'h-0.5'"
  >
    <div
      class="absolute size-2 rounded-full border-2 border-indicator bg-background outline-1 outline-offset-0 outline-background"
      :class="orientation === 'vertical'
        ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
        : 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'"
    />
  </div>
</template>
