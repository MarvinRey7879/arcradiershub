<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import LootTracker from '../components/LootTracker.vue';
import AdBanner from '../components/AdBanner.vue';

// i18n aktivieren
const { locale } = useI18n();

// --- SPRACHE UPDATE ---
const updateLanguage = (lang) => {
  locale.value = lang;
  localStorage.setItem('arc_tracker_lang', lang);
};

// --- DATEN STRUKTUREN ---

// Nur IDs und Actions bleiben im Code. Texte sind jetzt in de.json/en.json/es.json
const seoLootList = [
  { id: 'candle_berries', action: 'Keep' },
  { id: 'empty_wine_bottle', action: 'Keep' },
  { id: 'arc_powercell', action: 'Keep' },
  { id: 'leaper_pulse', action: 'Keep' },
  { id: 'magnetron', action: 'Keep' },
  { id: 'geiger', action: 'Recycle' },
  { id: 'ion_sputter', action: 'Recycle' },
  { id: 'bloated_tuna', action: 'Sell' },
  { id: 'film_reel', action: 'Keep' },
  { id: 'u_weapon', action: 'Recycle' },
  { id: 'arc_alloy', action: 'Keep' }
];

// Changelog Struktur: Definiert Version/Datum und Keys für die Texte
const changelogData = [
  { version: 'v1.3.0', date: '07. Jan 2026', key: 'v1_3_0', entries: ['t1', 't2'] },
  { version: 'v1.2.5', date: '31. Dec 2025', key: 'v1_2_5', entries: ['text'] },
  { version: 'v1.2.4', date: '31. Dec 2025', key: 'v1_2_4', entries: ['text'] },
  { version: 'v1.2.3', date: '27. Dec 2025', key: 'v1_2_3', entries: ['text'] },
  { version: 'v1.2.2', date: '26. Dec 2025', key: 'v1_2_2', entries: ['t1', 't2'] },
  { version: 'v1.2.1', date: '26. Dec 2025', key: 'v1_2_1', entries: ['t1', 't2', 't3'] },
  { version: 'v1.2.0', date: '23. Dec 2025', key: 'v1_2_0', entries: ['t1', 't2', 't3', 't4'] },
  { version: 'v1.1.0', date: '20. Dec 2025', key: 'v1_1_0', entries: ['t1', 't2', 't3'] }
];

// --- INITIALISIERUNG ---
onMounted(() => {
  const savedLang = localStorage.getItem('arc_tracker_lang');
  if (savedLang) {
    locale.value = savedLang;
  } else {
    const navLang = navigator.language || navigator.userLanguage;
    if (navLang) {
      const lowerLang = navLang.toLowerCase(); // Sicherheitshalber lowercase machen
      if (lowerLang.startsWith('de')) locale.value = 'de';
      else if (lowerLang.startsWith('es')) locale.value = 'es';
      else if (lowerLang.startsWith('ru')) locale.value = 'ru'; // <--- NEU
      else locale.value = 'en';
    }
  }
});
</script>

<template>
  <main>
    <LootTracker @lang-change="updateLanguage" />



    <div class="seo-footer">

      <div>
        <h1>{{ $t('seo.title') }}</h1>
        <p v-html="$t('seo.desc')"></p>
      </div>

      <div class="seo-faq">
        <div class="faq-item highlight-item">
          <h3>{{ $t('faq.q1') }}</h3>
          <p v-html="$t('faq.a1')"></p>
        </div>

        <div class="faq-item">
          <h3>{{ $t('faq.q2') }}</h3>
          <p v-html="$t('faq.a2')"></p>
        </div>

        <div class="faq-item">
          <h3>{{ $t('faq.q3') }}</h3>
          <p v-html="$t('faq.a3')"></p>
        </div>

        <div class="faq-item">
          <h3>{{ $t('faq.q4') }}</h3>
          <p v-html="$t('faq.a4')"></p>
        </div>
      </div>

      <details class="seo-details">
        <summary>
          <span>{{ $t('seo.lootTableTitle') }}</span>
        </summary>

        <div class="seo-content-block">
          <p style="margin-bottom: 15px; font-size: 0.85rem;">
            {{ $t('seo.lootTableSub') }}
          </p>

          <div class="seo-grid">
            <div v-for="item in seoLootList" :key="item.id" class="seo-item-row">
              <div class="seo-name">
                <strong>{{ $t(`loot.${item.id}.name`) }}</strong> <br>
                <span v-if="locale !== 'en'" class="sub-text">
                  {{ $t(`loot.${item.id}.reason`) }}
                </span>
                <span v-else class="sub-text">
                  {{ $t(`loot.${item.id}.reason`) }}
                </span>
              </div>
              <div class="seo-action" :class="item.action.toLowerCase()">
                {{ item.action }}
              </div>
            </div>
          </div>
        </div>
      </details>

      <details class="changelog-details">
        <summary>
          <span>{{ $t('seo.changelogTitle') }} ({{ changelogData[0].version }})</span>
        </summary>

        <div class="changelog-content">
          <div v-for="(log, index) in changelogData" :key="index" class="log-entry">
            <span class="log-date">{{ log.date }}</span>
            <span class="log-version">{{ log.version }}</span>

            <ul>
              <li v-for="entryKey in log.entries" :key="entryKey">
                <span v-html="$t(`changelog.${log.key}.${entryKey}`)"></span>
              </li>
            </ul>
          </div>
        </div>
      </details>

      <div class="legal-links">
        <router-link to="/datenschutz">Privacy Policy</router-link> |
        <router-link to="/disclaimer">Disclaimer</router-link> |
        <router-link to="/impressum">Imprint</router-link> |

        <a href="https://docs.google.com/forms/d/e/1FAIpQLScB29rIVFfq4Ph26HguDd7_ObpGSQmK09sf5VcMtsxzLr6lMQ/viewform"
          target="_blank" rel="noopener">
          {{ $t('seo.bugReport') }}
        </a>
      </div>
    </div>
  </main>
</template>

<style scoped>
.legal-links a {
  color: #ccc;
  text-decoration: none;
  margin: 0 10px;
  cursor: pointer;
  transition: color 0.2s;
}

.legal-links a:hover {
  color: #e74c3c;
  text-decoration: underline;
}

/* Optional: Bug Report leicht hervorheben */
.legal-links a[href*="forms"] {
  color: #e67e22;
  /* Ein leichtes Orange */
  font-weight: bold;
}

.changelog-details {
  margin: 40px auto;
  max-width: 700px;
  /* Etwas breiter für bessere Lesbarkeit */
  border: 1px solid #333;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  text-align: left;
}

.changelog-details summary {
  padding: 12px 20px;
  cursor: pointer;
  color: #888;
  font-family: monospace;
  font-size: 0.95rem;
  user-select: none;
  transition: color 0.2s;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.changelog-details summary:hover {
  color: #e74c3c;
  background: rgba(255, 255, 255, 0.05);
}

.changelog-content {
  padding: 20px;
  border-top: 1px solid #333;
  background: rgba(0, 0, 0, 0.4);
  max-height: 400px;
  overflow-y: auto;
}

.log-entry {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #333;
}

.log-entry:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.log-date {
  font-size: 0.8rem;
  color: #666;
  margin-right: 12px;
  font-family: monospace;
}

.log-version {
  background: #2c3e50;
  color: #3498db;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
}

.log-entry ul {
  margin: 12px 0 0 0;
  padding-left: 20px;
  color: #aaa;
  font-size: 0.9rem;
  line-height: 1.6;
}

.log-entry li {
  margin-bottom: 6px;
}

.log-entry strong {
  color: #ddd;
  font-weight: 600;
}

/* --- SEO FOOTER STYLES --- */
.seo-footer {
  max-width: 900px;
  margin: 80px auto 40px auto;
  padding: 20px;
  border-top: 1px solid #2a2a2a;
  color: #888;
  text-align: center;
}

.seo-footer h1 {
  font-size: 1.5rem;
  color: #e74c3c;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.seo-faq {
  margin: 30px 0;
  text-align: left;
}

.faq-item {
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.03);
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid #e74c3c;
}

/* Spezielles Highlighting für den neuen Patch-Content */
.faq-item.highlight-item {
  background: rgba(46, 204, 113, 0.05);
  /* Leichter Grünton für "Neu" */
  border-left: 3px solid #2ecc71;
}

.faq-item h3 {
  margin: 0 0 10px 0;
  color: #fff;
  font-size: 1.1rem;
}

.faq-item p {
  margin: 0;
  color: #bbb;
  font-size: 0.9rem;
  line-height: 1.5;
}

.seo-footer p {
  font-size: 0.95rem;
  line-height: 1.6;
  max-width: 750px;
  margin: 0 auto 25px auto;
  color: #aaa;
}

/* --- DETAILS / ACCORDION STYLES --- */
.seo-details {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 10px;
  text-align: left;
  border: 1px solid #333;
}

.seo-details summary {
  cursor: pointer;
  color: #ccc;
  font-weight: bold;
  padding: 10px;
  list-style: none;
  text-align: center;
}

.seo-details summary:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.seo-content-block {
  padding: 15px;
  margin-top: 10px;
  border-top: 1px solid #333;
}

/* --- SEO LISTE GRID --- */
.seo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.seo-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid #222;
}

.seo-name {
  color: #ddd;
}

.seo-name .sub-text {
  color: #777;
  font-size: 0.75rem;
  font-style: italic;
  display: block;
}

.seo-action {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 3px;
  margin: 0 10px;
}

.seo-action.keep {
  color: #2ecc71;
  border: 1px solid #2ecc71;
}

.seo-action.recycle {
  color: #3498db;
  border: 1px solid #3498db;
}

.seo-action.sell {
  color: #f1c40f;
  border: 1px solid #f1c40f;
}

/* --- LINKS --- */
.legal-links {
  margin-top: 40px;
  font-size: 0.8rem;
  opacity: 0.6;
}

.legal-links a {
  color: #ccc;
  text-decoration: none;
  margin: 0 10px;
  cursor: pointer;
}

.legal-links a:hover {
  color: #e74c3c;
  text-decoration: underline;
}
</style>