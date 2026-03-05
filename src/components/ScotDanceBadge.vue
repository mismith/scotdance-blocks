<script setup lang="ts">
import scotdanceIcon from '@/assets/touchicon-scotdance.png'
</script>

<template>
  <a
    href="https://scotdance.app"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-3 rounded-sm border-2 border-[#1976d2] bg-[#1976d2] px-2 py-1 shadow-md transition-all hover:border-[#1565c0] hover:bg-[#1565c0] hover:shadow-lg"
  >
    <img :src="scotdanceIcon" alt="ScotDance" class="h-8 w-8 object-contain" />
    <div class="flex flex-col items-start -space-y-0.5">
      <span class="text-[10px] font-medium uppercase tracking-wide text-white/90">Made for</span>
      <span class="text-base font-semibold text-white">ScotDance.app</span>
    </div>
  </a>
</template>
