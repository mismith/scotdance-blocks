<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import TouchIcon from '@/assets/touchicon.svg?component'
import AuthMenu from '@/components/AuthMenu.vue'
import ScotDanceBadge from '@/components/ScotDanceBadge.vue'

const hasSavedData = computed(() => localStorage.getItem('scotdance-blocks:data') !== null)
</script>

<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center">
    <div class="absolute right-4 top-4">
      <AuthMenu />
    </div>

    <TouchIcon class="size-20 rounded-2xl" />
    <h1 class="mt-6 text-4xl font-bold text-foreground">ScotDance Blocks</h1>
    <p class="mt-3 text-lg text-muted-foreground">
      Schedule builder for Highland dance competitions
    </p>
    <div class="mt-8 flex flex-wrap justify-center gap-4">
      <RouterLink
        to="/blocks"
        class="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground cursor-pointer hover:bg-primary/90"
      >
        {{ hasSavedData ? 'Continue' : 'Get Started' }}
      </RouterLink>
      <RouterLink
        to="/demo"
        class="rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground cursor-pointer hover:bg-muted"
      >
        View Demo
      </RouterLink>
    </div>

    <div class="mt-16 flex flex-col items-center gap-3">
      <ScotDanceBadge />
      <p class="text-xs text-muted-foreground">
        Sign in with your ScotDance.app account to save and sync across devices.
      </p>
    </div>
  </div>
</template>
