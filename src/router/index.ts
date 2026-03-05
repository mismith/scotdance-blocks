import { createRouter, createWebHistory } from 'vue-router'

import type { CompetitionData } from '@/types'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/blocks',
      component: () => import('../layouts/BlocksLayout.vue'),
      children: [
        {
          path: '',
          name: 'blocks',
          component: () => import('../views/BlocksView.vue'),
        },
      ],
    },
    {
      path: '/demo',
      component: () => import('../layouts/BlocksLayout.vue'),
      beforeEnter: async () => {
        const { useCompetitionStore } = await import('../stores/competition')
        const { default: sampleData } = await import('../data/sample-data.json')
        const store = useCompetitionStore()
        store.loadData(sampleData as CompetitionData)
      },
      children: [
        {
          path: '',
          name: 'demo',
          component: () => import('../views/BlocksView.vue'),
        },
      ],
    },
  ],
})

export default router
