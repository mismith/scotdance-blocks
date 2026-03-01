import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/dance-groups',
      name: 'dance-groups',
      component: () => import('../views/DanceGroupsView.vue'),
    },
  ],
})

export default router
