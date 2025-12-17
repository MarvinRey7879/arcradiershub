import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ImprintView from '../views/ImprintView.vue'
import PrivacyView from '../views/PrivacyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/impressum',
      name: 'impressum',
      component: ImprintView
    },
    {
      path: '/datenschutz',
      name: 'datenschutz',
      component: PrivacyView
    }
  ],
  scrollBehavior() {
    // Scrollt bei jedem Seitenwechsel nach oben
    return { top: 0 }
  }
})

export default router