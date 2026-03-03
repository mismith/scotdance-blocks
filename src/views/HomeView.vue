<script setup lang="ts">
import { RouterLink } from 'vue-router'

import TouchIcon from '@/assets/touchicon.svg?component'
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center">
    <TouchIcon class="size-20 rounded-2xl" />
    <h1 class="mt-6 text-4xl font-bold text-foreground">ScotDance Blocks</h1>
    <p class="mt-3 text-lg text-muted-foreground">
      Schedule builder for Highland dance competitions
    </p>
    <div class="mt-8 flex gap-4">
      <RouterLink
        to="/blocks"
        class="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground cursor-pointer hover:bg-primary/90"
      >
        Get Started
      </RouterLink>
      <RouterLink
        to="/demo"
        class="rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground cursor-pointer hover:bg-muted"
      >
        View Demo
      </RouterLink>
    </div>
  </div>
</template>
