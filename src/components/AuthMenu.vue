<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { ref, watch } from 'vue'

import { useAuth } from '@/composables/useAuth'
import { usePersistence } from '@/composables/usePersistence'
import ScotDanceBadge from '@/components/ScotDanceBadge.vue'

const { user, isLoading, isAuthenticated, error, signIn, register, resetPassword, signOut } =
  useAuth()
const {
  projects,
  activeProjectId,
  loadProject,
  createProject,
  deleteProject,
  newCompetition,
} = usePersistence()

const isOpen = ref(false)
const mode = ref<'menu' | 'login' | 'register' | 'reset-password'>('menu')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const resetSent = ref(false)

const anchorEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(anchorEl, floatingEl, {
  placement: 'bottom-end',
  middleware: [offset(6), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
})

watch(isOpen, (open) => {
  if (open) {
    mode.value = isAuthenticated.value ? 'menu' : 'login'
    password.value = ''
    showPassword.value = false
    resetSent.value = false
    error.value = null
    // email is intentionally preserved across opens
  }
})

function switchMode(newMode: 'login' | 'register' | 'reset-password') {
  mode.value = newMode
  password.value = ''
  showPassword.value = false
  resetSent.value = false
  error.value = null
  // email is preserved
}

async function handleSubmit() {
  if (!email.value || !password.value) return
  isSubmitting.value = true
  try {
    if (mode.value === 'register') {
      await register(email.value, password.value)
    } else {
      await signIn(email.value, password.value)
    }
    isOpen.value = false
  } catch {
    // error is already set in useAuth
  } finally {
    isSubmitting.value = false
  }
}

async function handleResetPassword() {
  if (!email.value) return
  isSubmitting.value = true
  try {
    await resetPassword(email.value)
    resetSent.value = true
  } catch {
    // error is already set in useAuth
  } finally {
    isSubmitting.value = false
  }
}

async function handleSignOut() {
  await signOut()
  isOpen.value = false
}

async function handleOpenProject(projectId: string) {
  await loadProject(projectId)
  isOpen.value = false
}

async function handleNewCompetition() {
  if (isAuthenticated.value) {
    const id = await createProject('Untitled Competition', {
      categories: {},
      groups: {},
      dances: {},
      platforms: {},
      staff: {},
      schedule: { name: '', date: '', blocks: {} },
    })
    if (id) {
      newCompetition()
      await loadProject(id)
    }
  } else {
    newCompetition()
  }
  isOpen.value = false
}

async function handleDeleteProject(projectId: string) {
  if (!confirm('Delete this competition? This cannot be undone.')) return
  await deleteProject(projectId)
}

function formatDate(timestamp: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="relative">
    <button
      ref="anchorEl"
      class="flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      @click="isOpen = !isOpen"
    >
      <template v-if="isLoading">
        <span class="size-4 animate-pulse rounded-full bg-muted" />
      </template>
      <template v-else-if="isAuthenticated">
        <span
          class="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
        >
          {{ user?.email?.[0]?.toUpperCase() }}
        </span>
        <span class="max-w-32 truncate">{{ user?.email }}</span>
      </template>
      <template v-else> Login </template>
    </button>

    <Teleport to="body">
      <template v-if="isOpen">
        <div class="fixed inset-0 z-40" @click="isOpen = false" />
        <div
          ref="floatingEl"
          class="z-50 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          :style="floatingStyles"
        >
          <!-- Login / Register form -->
          <template v-if="!isAuthenticated && (mode === 'login' || mode === 'register')">
            <form class="p-5" @submit.prevent="handleSubmit">
              <div class="mb-5 flex flex-col items-center gap-3 text-center">
                <ScotDanceBadge />
                <div>
                  <h3 class="text-sm font-semibold text-foreground">
                    {{ mode === 'register' ? 'Register' : 'Login' }}
                  </h3>
                  <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                    <template v-if="mode === 'login'">
                      Save and sync your competitions across devices.
                    </template>
                    <template v-else>
                      Your ScotDance.app account works here too.
                    </template>
                  </p>
                </div>
              </div>

              <div class="space-y-2.5">
                <label class="block">
                  <span class="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
                  <input
                    v-model="email"
                    type="email"
                    required
                    autocomplete="email"
                    class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="you@example.com"
                  />
                </label>

                <label class="block">
                  <span class="mb-1 block text-xs font-medium text-muted-foreground">
                    {{ mode === 'register' ? 'New Password' : 'Password' }}
                  </span>
                  <div class="relative">
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      required
                      :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
                      class="w-full rounded-md border border-border bg-background px-3 py-2 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
                      :placeholder="mode === 'register' ? 'At least 6 characters' : 'Password'"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                      tabindex="-1"
                      @click="showPassword = !showPassword"
                    >
                      <!-- Eye open -->
                      <svg
                        v-if="!showPassword"
                        class="size-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fill-rule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <!-- Eye closed -->
                      <svg v-else class="size-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fill-rule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                          clip-rule="evenodd"
                        />
                        <path
                          d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                        />
                      </svg>
                    </button>
                  </div>
                </label>
              </div>

              <p v-if="error" class="mt-3 text-xs text-red-500">
                {{ error }}
              </p>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {{ isSubmitting ? 'Please wait\u2026' : mode === 'register' ? 'Register' : 'Login' }}
              </button>

              <div class="mt-3 space-y-1 text-center text-xs text-muted-foreground">
                <p v-if="mode === 'login'">
                  Need an account first?
                  <button
                    type="button"
                    class="font-medium text-foreground underline underline-offset-2"
                    @click="switchMode('register')"
                  >
                    Register
                  </button>
                </p>
                <p v-else>
                  Already have an account?
                  <button
                    type="button"
                    class="font-medium text-foreground underline underline-offset-2"
                    @click="switchMode('login')"
                  >
                    Login
                  </button>
                </p>
                <p v-if="mode === 'login'">
                  Can't log in?
                  <button
                    type="button"
                    class="font-medium text-foreground underline underline-offset-2"
                    @click="switchMode('reset-password')"
                  >
                    Reset Password
                  </button>
                </p>
              </div>
            </form>
          </template>

          <!-- Reset password -->
          <template v-else-if="!isAuthenticated && mode === 'reset-password'">
            <div class="p-5">
              <div class="mb-5 flex flex-col items-center gap-3 text-center">
                <ScotDanceBadge />
                <div>
                  <h3 class="text-sm font-semibold text-foreground">Reset Password</h3>
                  <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                    We can send you a link to reset your password.
                  </p>
                </div>
              </div>

              <template v-if="resetSent">
                <p class="text-center text-sm text-foreground">
                  Check your email for a reset link.
                </p>
                <button
                  class="mt-4 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  @click="switchMode('login')"
                >
                  Back to Login
                </button>
              </template>

              <form v-else @submit.prevent="handleResetPassword">
                <label class="block">
                  <span class="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
                  <input
                    v-model="email"
                    type="email"
                    required
                    autocomplete="email"
                    class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="you@example.com"
                  />
                </label>

                <p v-if="error" class="mt-3 text-xs text-red-500">
                  {{ error }}
                </p>

                <div class="mt-4 flex gap-2">
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    @click="switchMode('login')"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {{ isSubmitting ? 'Please wait\u2026' : 'Send' }}
                  </button>
                </div>
              </form>
            </div>
          </template>

          <!-- Authenticated menu -->
          <template v-else-if="isAuthenticated">
            <div class="border-b border-border px-4 py-3">
              <p class="truncate text-sm font-medium text-foreground">
                {{ user?.email }}
              </p>
              <p class="text-xs text-muted-foreground">Signed in via ScotDance.app</p>
            </div>

            <div class="max-h-64 overflow-y-auto">
              <div class="px-4 pt-3 pb-1.5">
                <span
                  class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >Competitions</span
                >
              </div>
              <div
                v-if="projects.length === 0"
                class="px-4 py-3 text-xs text-muted-foreground"
              >
                No saved competitions yet.
              </div>
              <div
                v-for="project in projects"
                :key="project.id"
                role="button"
                tabindex="0"
                class="group flex w-full items-center gap-2 px-4 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
                :class="activeProjectId === project.id ? 'bg-muted' : ''"
                @click="handleOpenProject(project.id)"
                @keydown.enter="handleOpenProject(project.id)"
                @keydown.space.prevent="handleOpenProject(project.id)"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm text-foreground">{{ project.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatDate(project.updatedAt) }}
                  </p>
                </div>
                <button
                  class="shrink-0 rounded p-1 text-muted-foreground/60 opacity-0 outline-none hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  title="Delete"
                  @click.stop="handleDeleteProject(project.id)"
                >
                  <svg
                    class="size-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="border-t border-border p-1.5">
              <button
                class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:bg-muted"
                @click="handleNewCompetition"
              >
                <svg
                  class="size-4 text-muted-foreground"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                >
                  <path d="M8 3v10M3 8h10" />
                </svg>
                New Competition
              </button>
              <button
                class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:bg-muted"
                @click="handleSignOut"
              >
                Sign out
              </button>
            </div>
          </template>
        </div>
      </template>
    </Teleport>
  </div>
</template>
