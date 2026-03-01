import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'scotdance-density'
const comfortable = ref(localStorage.getItem(STORAGE_KEY) !== 'compact')

watchEffect(() => {
  if (comfortable.value) {
    document.documentElement.dataset.density = 'comfortable'
    localStorage.removeItem(STORAGE_KEY)
  } else {
    delete document.documentElement.dataset.density
    localStorage.setItem(STORAGE_KEY, 'compact')
  }
})

export function useDensity() {
  return { comfortable }
}
