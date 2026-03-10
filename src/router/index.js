import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase/client'

const routes = [
  { path: '/', component: () => import('@/views/HomeView.vue') },
  { path: '/explore', component: () => import('@/views/explore/ExploreView.vue') },
  // ... rutas públicas
  
  // Rutas protegidas
  { 
    path: '/dashboard', 
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({ history: createWebHistory(), routes })

// Guard de navegación
router.beforeEach(async (to, from, next) => {
  const { session  } = await supabase.auth.getSession()
  if (to.meta.requiresAuth && !session) {
    next('/login')
  } else {
    next()
  }
})

export default router