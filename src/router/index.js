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
      component: HomeView,
      meta: {
        title: 'ARC Raiders Loot Tracker & Recycling Guide (2025)',
        description: 'Interaktive Loot Tabelle für ARC Raiders. Erfahre sofort, welche Items du behalten, verkaufen oder recyceln solltest.'
      }
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
router.afterEach((to) => {
  const defaultTitle = 'ARC Raiders Items Tool';
  document.title = to.meta.title || defaultTitle;

  // Optional: Meta Description ändern (für Profis)
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && to.meta.description) {
    metaDesc.setAttribute('content', to.meta.description);
  }
});

export default router