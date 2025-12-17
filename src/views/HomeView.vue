<script setup>
import { ref, onMounted } from 'vue';
import LootTracker from '../components/LootTracker.vue';
import AdBanner from '../components/AdBanner.vue';

const browserLang = ref('en');

// --- SEO DATEN ---
const seoLootList = [
  {
    id: 'arc_powercell',
    de: 'ARC-Energiezelle', en: 'ARC Powercell', es: 'Celda de energía ARC',
    action: 'Keep', reason: 'Crafting / Handwerk / Artesanía (Workshop)'
  },
  {
    id: 'leaper_pulse',
    de: 'Springer-Pulseinheit', en: 'Leaper Pulse Unit', es: 'Unidad de pulso de saltador',
    action: 'Keep', reason: 'High Value / Quest Item / Misión'
  },
  {
    id: 'magnetron',
    de: 'Magnetron', en: 'Magnetron', es: 'Magnetrón',
    action: 'Keep', reason: 'Quest Item / Objeto de misión'
  },
  {
    id: 'geiger',
    de: 'Geigerzähler', en: 'Geiger Counter', es: 'Contador Geiger',
    action: 'Recycle', reason: 'Yields Batteries & Modules / Baterías y módulos'
  },
  {
    id: 'ion_sputter',
    de: 'Ionenzerstäuber', en: 'Ion Sputter', es: 'Pulverizador iónico',
    action: 'Recycle', reason: 'Yields Voltage Converters / Convertidores de voltaje'
  },
  {
    id: 'bloated_tuna',
    de: 'Aufgeblähte Thunfischdose', en: 'Bloated Tuna Can', es: 'Lata de atún hinchada',
    action: 'Sell', reason: 'Trinket / Wertsache / Baratija'
  },
  {
    id: 'film_reel',
    de: 'Filmrolle', en: 'Film Reel', es: 'Rollo de película',
    action: 'Keep', reason: 'Quest Item / Misión'
  },
  {
    id: 'u_weapon',
    de: 'Unbrauchbare Waffe', en: 'Unusable Weapon', es: 'Arma inutilizable',
    action: 'Recycle', reason: 'Yields Gun Parts / Piezas de armas'
  },
  {
    id: 'arc_alloy',
    de: 'ARC-Legierung', en: 'ARC Alloy', es: 'Aleación ARC',
    action: 'Keep', reason: 'Essential Crafting Material / Material esencial'
  }
];

// --- LOGIK ---
onMounted(() => {
  const navLang = navigator.language || navigator.userLanguage;
  if (navLang) {
    if (navLang.startsWith('de')) browserLang.value = 'de';
    else if (navLang.startsWith('es')) browserLang.value = 'es';
    else browserLang.value = 'en';
  }
});
</script>

<template>
  <main>
    <LootTracker />

    <AdBanner />

    <div class="seo-footer">

      <h1 v-if="browserLang === 'de'">ARC Raiders Loot Tabelle & Recycling Guide</h1>
      <h1 v-else-if="browserLang === 'es'">Guía de Reciclaje y Tabla de Botín de ARC Raiders</h1>
      <h1 v-else>ARC Raiders Loot Table & Recycling Guide</h1>

      <p v-if="browserLang === 'de'">
        Nutze diesen interaktiven Tracker, um dein Inventar in ARC Raiders zu managen.
        Finde sofort heraus, welche Items du <strong>behalten (Keep)</strong>, <strong>verkaufen (Sell)</strong> oder
        <strong>recyceln</strong> solltest.
      </p>
      <p v-else-if="browserLang === 'es'">
        Usa este rastreador interactivo para gestionar tu inventario en ARC Raiders.
        Decide al instante si debes <strong>guardar (Keep)</strong>, <strong>vender (Sell)</strong> o
        <strong>reciclar</strong> objetos basándote en las necesidades de fabricación y misiones.
      </p>
      <p v-else>
        Use this interactive tracker to manage your inventory in ARC Raiders.
        Instantly decide whether to <strong>Keep</strong>, <strong>Sell</strong>, or <strong>Recycle</strong> items
        based on crafting needs and quest requirements.
      </p>

      <details class="seo-details">
        <summary>
          <span v-if="browserLang === 'de'">📜 Vollständige Item Liste & Tipps anzeigen</span>
          <span v-else-if="browserLang === 'es'">📜 Mostrar lista completa de objetos y consejos</span>
          <span v-else>📜 Show Full Item List & Tips</span>
        </summary>

        <div class="seo-content-block">
          <h3>Loot Database (Deutsch / English / Español)</h3>
          <p>Complete list of materials, recyclables, and trinkets.</p>

          <div class="seo-grid">
            <div v-for="item in seoLootList" :key="item.id" class="seo-item-row">
              <div class="seo-name">
                <strong>{{ item.en }}</strong> <br>
                <span class="sub-text de">{{ item.de }}</span><br>
                <span class="sub-text es">{{ item.es }}</span>
              </div>
              <div class="seo-action" :class="item.action.toLowerCase()">
                {{ item.action }}
              </div>
              <div class="seo-reason">
                {{ item.reason }}
              </div>
            </div>
            <div class="seo-item-row">
              <div class="seo-name">... and 400+ more items.</div>
            </div>
          </div>

          <div class="seo-text-columns">
            <div class="col">
              <h4 v-if="browserLang === 'de'">Warum Recyceln?</h4>
              <h4 v-else-if="browserLang === 'es'">¿Por qué reciclar?</h4>
              <h4 v-else>Why Recycle?</h4>
              <p v-if="browserLang === 'de'">Das Recyceln von Items wie <em>Unbrauchbare Waffen</em> liefert wichtige
                Materialien wie <strong>ARC-Legierung</strong>.</p>
              <p v-else-if="browserLang === 'es'">Reciclar objetos como <em>Armas inutilizables</em> proporciona
                materiales esenciales como <strong>Aleación ARC</strong>.</p>
              <p v-else>Recycling items like <em>Unusable Weapons</em> yields essential crafting materials like
                <strong>ARC Alloy</strong>.
              </p>
            </div>
            <div class="col">
              <h4 v-if="browserLang === 'de'">Quest Items</h4>
              <h4 v-else-if="browserLang === 'es'">Objetos de Misión</h4>
              <h4 v-else>Quest Items</h4>
              <p v-if="browserLang === 'de'">Manche Items wie <em>Verschiedenes Saatgut</em> sind wichtig für
                Händler-Quests (Celeste). Nicht verkaufen!</p>
              <p v-else-if="browserLang === 'es'">Algunos objetos como <em>Semillas variadas</em> son críticos para las
                misiones de vendedores (Celeste). ¡No los vendas!</p>
              <p v-else>Some items like <em>Assorted Seeds</em> are critical for vendor quests (Celeste). Do not sell
                these!</p>
            </div>
          </div>
        </div>
      </details>

      <div class="legal-links">
        <router-link to="/datenschutz">Privacy Policy (Datenschutz)</router-link> |
        <router-link to="/impressum">Imprint (Impressum)</router-link>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* --- SEO FOOTER STYLES (spezifisch für diese Seite) --- */
.seo-footer {
  max-width: 900px;
  margin: 80px auto 40px auto;
  padding: 20px;
  border-top: 1px solid #2a2a2a;
  color: #888;
  text-align: center;
}

.seo-footer h1 {
  font-size: 1.4rem;
  color: #e74c3c;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.seo-footer p {
  font-size: 0.95rem;
  line-height: 1.6;
  max-width: 700px;
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

.seo-content-block h3 {
  color: #fff;
  margin-top: 0;
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

.seo-reason {
  color: #999;
  font-size: 0.75rem;
  text-align: right;
  max-width: 100px;
}

.seo-text-columns {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.seo-text-columns .col {
  flex: 1;
  min-width: 250px;
}

.seo-text-columns h4 {
  color: #e74c3c;
  margin-bottom: 5px;
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

/* Damit router-link-active (die aktive Seite) nicht komisch aussieht: */
.legal-links a.router-link-active {
  color: #fff;
  font-weight: bold;
}
</style>