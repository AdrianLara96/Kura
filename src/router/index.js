import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase/client'

// Importación directa
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import ExploreView from '@/views/explore/ExploreView.vue'
import ArtworkDetail from '@/views/explore/ArtworkDetail.vue'
import ProfileEdit from '@/views/profile/ProfileEdit.vue'
import PublicProfileView from '@/views/profile/PublicProfileView.vue'

// Guard simple para rutas protegidas
async function requireAuth(to, from, next) {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    next()
  } else {
    next({ path: '/login', query: { redirect: to.fullPath } })
  }
}

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: false } },
  { path: '/explore', name: 'explore', component: ExploreView, meta: { requiresAuth: false } },
  { path: '/artwork/:id', name: 'artwork-detail', component: ArtworkDetail, props: true, meta: { requiresAuth: false } },
  { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false, hideForAuth: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { requiresAuth: false, hideForAuth: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/my-profile', name: 'profile-edit', component: ProfileEdit, meta: { requireAuth: true } },
  { path: '/profile/:username', name: 'public-profile', component: PublicProfileView, meta: { requireAuth: false } }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Guard global
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    await requireAuth(to, from, next)
  } else if (to.meta.hideForAuth) {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      next({ path: '/dashboard' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router