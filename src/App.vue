<script setup lang="ts">
import { DnDProvider } from '@vue-dnd-kit/core'
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex h-screen flex-col">
    <header class="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3">
      <h1 class="text-lg font-bold text-gray-900">ScotDance Blocks</h1>
    </header>

    <DnDProvider overlay-to="body">
      <RouterView class="flex-1 overflow-hidden" />
    </DnDProvider>
  </div>
</template>
