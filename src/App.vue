<script setup>
import { ref, onMounted, computed } from 'vue';
import { initAnalytics } from './firebase.js'; // Pfad ggf. anpassen, wenn firebase.js woanders liegt

// --- STATE FÜR DEN GLOBALEN COOKIE BANNER ---
const showCookieBanner = ref(false);
const browserLang = ref('en');

// --- TEXTE (DE / EN / ES) ---
const texts = {
  de: { title: 'Kekse? 🍪', msg: 'Wir nutzen Cookies und Analytics für ein besseres Erlebnis.', yes: 'Alles klar!', no: 'Nein, danke' },
  en: { title: 'Cookies? 🍪', msg: 'We use cookies and analytics to ensure you get the best experience.', yes: 'Got it!', no: 'No, thanks' },
  es: { title: 'Galletas? 🍪', msg: 'Usamos cookies y análisis para asegurar que tengas la mejor experiencia.', yes: 'Entendido!', no: 'No, gracias' }
};
const t = computed(() => texts[browserLang.value] || texts.en);

// --- HELPER ---
const isLikelyEU = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith('Europe/'); } catch (e) { return true; }
};

// --- LOGIK ---
onMounted(() => {
  const navLang = navigator.language || navigator.userLanguage;
  if (navLang) {
    if (navLang.startsWith('de')) browserLang.value = 'de';
    else if (navLang.startsWith('es')) browserLang.value = 'es';
    else browserLang.value = 'en';
  }

  const consent = localStorage.getItem('cookie_consent');
  if (consent === 'granted') { initAnalytics(); }
  else if (consent === 'denied') { showCookieBanner.value = false; }
  else {
    if (isLikelyEU()) { showCookieBanner.value = true; }
    else { initAnalytics(); showCookieBanner.value = false; }
  }
});

const acceptCookies = () => { localStorage.setItem('cookie_consent', 'granted'); showCookieBanner.value = false; initAnalytics(); };
const declineCookies = () => { localStorage.setItem('cookie_consent', 'denied'); showCookieBanner.value = false; };
</script>

<template>
  <router-view />

  <transition name="fade-slide">
    <div v-if="showCookieBanner" class="cookie-card">
      <div class="cookie-content">
        <div class="icon-area">🍪</div>
        <div class="text-area"><strong>{{ t.title }}</strong>
          <p>{{ t.msg }}</p>
        </div>
      </div>
      <div class="button-area">
        <button @click="declineCookies" class="btn-decline">{{ t.no }}</button>
        <button @click="acceptCookies" class="btn-accept">{{ t.yes }}</button>
      </div>
    </div>
  </transition>
</template>

<style>
/* --- GLOBALE STYLES (gelten für die ganze App) --- */
body {
  margin: 0;
  padding: 0;
  background-color: #121212;
  color: white;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

#app {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  display: block;
}

/* --- COOKIE CARD STYLES --- */
.cookie-card {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  max-width: 90%;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #333;
  border-left: 4px solid #e74c3c;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

@media (max-width: 600px) {
  .cookie-card {
    right: 50%;
    transform: translateX(50%);
    bottom: 20px;
    width: 90%;
  }
}

.cookie-content {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.icon-area {
  font-size: 1.8rem;
}

.text-area strong {
  display: block;
  font-size: 1rem;
  margin-bottom: 4px;
  color: #fff;
}

.text-area p {
  margin: 0;
  font-size: 0.85rem;
  color: #b0b0b0;
  line-height: 1.4;
}

.button-area {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-accept {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-accept:hover {
  background-color: #c0392b;
}

.btn-decline {
  background: transparent;
  color: #888;
  border: 1px solid transparent;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.btn-decline:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>