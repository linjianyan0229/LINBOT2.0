import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/dashboard/index.vue')
  },
  {
    path: '/plugins',
    name: 'plugins',
    component: () => import('../views/plugins/index.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/settings/index.vue')
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('../views/friends/index.vue')
  },
  {
    path: '/groups',
    name: 'groups',
    component: () => import('../views/groups/index.vue')
  },
  {
    path: '/ai-settings',
    name: 'ai-settings',
    component: () => import('../views/ai-settings/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 