<script setup>
import { ref, onMounted } from 'vue';
import LootTracker from '../components/LootTracker.vue';
import AdBanner from '../components/AdBanner.vue';

const browserLang = ref('en');

// --- SEO DATEN (Kombiniert: Patch 1.7.0 + Evergreen Items) ---
const seoLootList = [
  // NEU: Patch 1.7.0 Items
  {
    id: 'candle_berries',
    de: 'Kerzenbeeren (Neu)', en: 'Candleberries (New)', es: 'Bayas de vela (Nuevo)',
    action: 'Keep', reason: 'Flickering Flames Event / Winter Project'
  },
  {
    id: 'empty_wine_bottle',
    de: 'Leere Weinflasche', en: 'Empty Wine Bottle', es: 'Botella de vino vacía',
    action: 'Keep', reason: 'Event Item: Candleberry Banquet'
  },
  // ALT: Wichtige Standard-Items (beibehalten für SEO)
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

      <div v-if="browserLang === 'de'">
        <h1>ARC Raiders Loot Liste & Recycling Guide (Patch 1.7.0)</h1>
        <p>
          Willkommen in der größten und aktuellsten <strong>ARC Raiders Item Datenbank</strong>.
          Unser Tracker ist live aktualisiert für den <strong>Patch 1.7.0 "Cold Snap"</strong>.
          Wir decken alles ab: Vom neuen <strong>"Flackernde Flammen" (Flickering Flames)</strong> Event bis zum
          großen <strong>Expeditionsprojekt (Prestige)</strong>.
          Gleichzeitig findest du hier alle Infos zu klassischen Items: Solltest du Loot <strong>behalten
            (Keep)</strong>,
          für Cash <strong>verkaufen (Sell)</strong> oder für Crafting-Materialien <strong>recyceln</strong>?
        </p>
      </div>

      <div v-else-if="browserLang === 'es'">
        <h1>Guía de Reciclaje y Tabla de Botín ARC Raiders (Parche 1.7.0)</h1>
        <p>
          Bienvenido a la mayor base de datos de <strong>ARC Raiders</strong>, actualizada para el
          <strong>Parche 1.7.0 "Cold Snap"</strong>.
          Cubrimos todo: desde el nuevo evento <strong>"Llamas Parpadeantes" (Flickering Flames)</strong> hasta el
          gran <strong>Proyecto de Expedición (Prestigio)</strong>.
          Nuestro rastreador te ayuda a decidir al instante: ¿<strong>Guardar (Keep)</strong>, vender por dinero o
          <strong>reciclar</strong> para materiales?
        </p>
      </div>

      <div v-else>
        <h1>ARC Raiders Loot Table & Recycling Guide (Patch 1.7.0)</h1>
        <p>
          Welcome to the biggest and most up-to-date <strong>ARC Raiders Item Database</strong>.
          Our list is live-updated for the <strong>Patch 1.7.0 "Cold Snap"</strong> release.
          We cover everything: From the new <strong>"Flickering Flames"</strong> winter event to the
          major <strong>Expedition Project (Prestige)</strong> mechanics.
          Our tracker tells you instantly: Should you <strong>Keep loot</strong>, <strong>Sell</strong> for cash, or
          <strong>Recycle</strong> for crafting materials?
        </p>
      </div>

      <div class="seo-faq">

        <div class="faq-item highlight-item">
          <h3 v-if="browserLang === 'de'">❄️ Welche Items muss ich für das "Flackernde Flammen" Event in ARC Raiders
            behalten?</h3>
          <h3 v-else-if="browserLang === 'es'">❄️ ¿Qué objetos guardar para el evento "Llamas Parpadeantes" en ARC
            Raiders?</h3>
          <h3 v-else>❄️ Which items to keep for the "Flickering Flames" event in ARC Raiders?</h3>

          <p v-if="browserLang === 'de'">
            Für das neue <strong>Winter-Projekt (Candleberry Banquet)</strong> musst du spezielle Items sammeln.
            Behalte unbedingt: <strong>Kerzenbeeren (Candleberries)</strong>, <em>Leere Weinflaschen</em>,
            <em>Kaffeekannen</em> und <em>Plastikteile</em>. Unser Tracker markiert diese neuen 1.7.0 Items
            automatisch als "Keep".
          </p>
          <p v-else-if="browserLang === 'es'">
            Para el nuevo <strong>Proyecto de Invierno (Candleberry Banquet)</strong> necesitas recolectar objetos
            específicos.
            Asegúrate de guardar: <strong>Bayas de vela (Candleberries)</strong>, <em>Botellas de vino vacías</em>,
            <em>Cafeteras</em> y <em>Piezas de plástico</em>. Nuestro rastreador marca estos nuevos objetos
            automáticamente.
          </p>
          <p v-else>
            For the new <strong>Winter Project (Candleberry Banquet)</strong>, you need to scavenge specific items.
            Definitely keep: <strong>Candleberries</strong>, <em>Empty Wine Bottles</em>, <em>Coffee Pots</em>, and
            <em>Plastic Parts</em>.
            Our tracker automatically marks these new 1.7.0 items as "Keep".
          </p>
        </div>

        <div class="faq-item">
          <h3 v-if="browserLang === 'de'">Sollte ich ARC-Energiezellen (Powercells) verkaufen?</h3>
          <h3 v-else-if="browserLang === 'es'">¿Debo vender Celdas de energía ARC en el juego?</h3>
          <h3 v-else>Should I sell ARC Powercells in ARC Raiders?</h3>

          <p v-if="browserLang === 'de'">
            Nein! Auch in Patch 1.7.0 sind <strong>ARC-Energiezellen</strong> essenziell für Waffen-Upgrades an der
            Werkbank.
            Verkaufe sie niemals an den Automaten.
          </p>
          <p v-else-if="browserLang === 'es'">
            ¡No! Incluso en el parche 1.7.0, las <strong>Celdas de energía ARC</strong> son esenciales para mejorar
            armas.
            Nunca las vendas.
          </p>
          <p v-else>
            No! Even in Patch 1.7.0, <strong>ARC Powercells</strong> are essential for weapon upgrades at the workbench.
            Never sell them to the vending machines.
          </p>
        </div>

        <div class="faq-item">
          <h3 v-if="browserLang === 'de'">Recycling Guide: Welche Items sollte ich in ARC Raiders verwerten?</h3>
          <h3 v-else-if="browserLang === 'es'">Guía de reciclaje: ¿Qué objetos debo reciclar en ARC Raiders?</h3>
          <h3 v-else>Recycling Guide: Which items should I recycle in ARC Raiders?</h3>

          <p v-if="browserLang === 'de'">
            Du solltest fast immer <strong>Unbrauchbare Waffen</strong> und Elektronik wie <em>Geigerzähler</em>
            recyceln. Das ist der beste Weg, um an <strong>ARC-Legierung</strong> für das
            <strong>Expeditionsprojekt</strong> zu kommen.
          </p>
          <p v-else-if="browserLang === 'es'">
            Casi siempre debes reciclar <strong>Armas inutilizables</strong> y electrónica como <em>Contadores
              Geiger</em>.
            Es la mejor forma de obtener <strong>Aleación ARC</strong> para el <strong>Proyecto de Expedición</strong>.
          </p>
          <p v-else>
            You should almost always recycle <strong>Unusable Weapons</strong> and electronics like <em>Geiger
              Counters</em>.
            This is the best way to get <strong>ARC Alloy</strong> needed for the new <strong>Expedition
              Project</strong>.
          </p>
        </div>

        <div class="faq-item">
          <h3 v-if="browserLang === 'de'">Liste wichtiger Quest-Gegenstände in ARC Raiders</h3>
          <h3 v-else-if="browserLang === 'es'">Lista de objetos de misión importantes en ARC Raiders</h3>
          <h3 v-else>List of important Quest Items in ARC Raiders</h3>

          <p v-if="browserLang === 'de'">
            Achte auf <strong>Verschiedenes Saatgut</strong>, <em>Filmrollen</em> und <em>Magnetrons</em>.
            Diese werden oft für Verträge beim Händler Celeste benötigt.
          </p>
          <p v-else-if="browserLang === 'es'">
            Presta atención a las <strong>Semillas variadas</strong>, <em>Rollos de película</em> y
            <em>Magnetrones</em>.
            A menudo se necesitan para contratos con la vendedora Celeste.
          </p>
          <p v-else>
            Pay special attention to <strong>Assorted Seeds</strong>, <em>Film Reels</em>, and <em>Magnetrons</em>.
            These are often required for contracts with the vendor Celeste.
          </p>
        </div>

      </div>

      <details class="seo-details">
        <summary>
          <span v-if="browserLang === 'de'">📜 Beispielhafte 1.7.0 Items & Loot-Werte anzeigen</span>
          <span v-else-if="browserLang === 'es'">📜 Mostrar ejemplos de objetos y valores (1.7.0)</span>
          <span v-else>📜 Show Example Items & Loot Values (1.7.0)</span>
        </summary>

        <div class="seo-content-block">

          <p v-if="browserLang === 'de'" style="margin-bottom: 15px; font-size: 0.85rem;">
            Aktualisierte Datenbank für Patch 1.7.0 "Cold Snap". Enthält Kerzenbeeren, neue Quest-Items und
            Recycling-Material.
          </p>
          <p v-else-if="browserLang === 'es'" style="margin-bottom: 15px; font-size: 0.85rem;">
            Base de datos actualizada para el parche 1.7.0 "Cold Snap". Incluye bayas de vela, nuevos objetos de misión
            y reciclables.
          </p>
          <p v-else style="margin-bottom: 15px; font-size: 0.85rem;">
            Updated Database for Patch 1.7.0 "Cold Snap". Includes Candleberries, new Quest Items, and Recyclables.
          </p>

          <div class="seo-grid">
            <div v-for="item in seoLootList" :key="item.id" class="seo-item-row">
              <div class="seo-name">
                <template v-if="browserLang === 'de'">
                  <strong>{{ item.de }}</strong> <br>
                  <span class="sub-text">{{ item.en }}</span>
                </template>
                <template v-else-if="browserLang === 'es'">
                  <strong>{{ item.es }}</strong> <br>
                  <span class="sub-text">{{ item.en }}</span>
                </template>
                <template v-else>
                  <strong>{{ item.en }}</strong>
                </template>
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
          <span v-if="browserLang === 'de'">🛠️ Changelog & Updates (v1.2.0)</span>
          <span v-else-if="browserLang === 'es'">🛠️ Registro de cambios (v1.2.0)</span>
          <span v-else>🛠️ Changelog & Updates (v1.2.0)</span>
        </summary>

        <div class="changelog-content">

          <div class="log-entry">
            <span class="log-date">23. Dec 2025</span>
            <span class="log-version">v1.2.0</span>

            <ul v-if="browserLang === 'de'">
              <li><strong>Neu:</strong> 🏗️ Projekt-Filter hinzugefügt! Tracke jetzt Expeditionen und Events.</li>
              <li><strong>Neu:</strong> 🐛 "Fehler melden"-Link ganz unten im Footer hinzugefügt.</li>
              <li><strong>Fix:</strong> Fehlende Items ergänzt & falsch markierte Items korrigiert (z.B. Rosary, Flow
                Controller).</li>
              <li><strong>Logik:</strong> Bessere Erkennung für "Recyclable" vs. "Crafting" Items.</li>
            </ul>

            <ul v-else-if="browserLang === 'es'">
              <li><strong>Nuevo:</strong> 🏗️ ¡Filtro de Proyectos! Rastrea expediciones y eventos.</li>
              <li><strong>Nuevo:</strong> 🐛 Enlace para "Reportar error" añadido al pie de página.</li>
              <li><strong>Corrección:</strong> Se añadieron objetos faltantes y se corrigieron marcadores erróneos.</li>
              <li><strong>Lógica:</strong> Mejor detección de objetos para reciclar vs. artesanía.</li>
            </ul>

            <ul v-else>
              <li><strong>New:</strong> 🏗️ Project Filter added! Track Expeditions and Events.</li>
              <li><strong>New:</strong> 🐛 Added "Report Bug" link at the very bottom (footer).</li>
              <li><strong>Fix:</strong> Added missing items & fixed incorrectly marked items (e.g., Rosary, Flow
                Controller).
              </li>
              <li><strong>Logic:</strong> Improved detection for "Recyclable" vs. "Crafting" items.</li>
            </ul>
          </div>

          <div class="log-entry">
            <span class="log-date">20. Dec 2025</span>
            <span class="log-version">v1.1.0</span>

            <ul v-if="browserLang === 'de'">
              <li><strong>Neu:</strong> 📜 Quest-Tracker! Markiere Quests als erledigt.</li>
              <li><strong>Feature:</strong> Tutorial für neue Nutzer hinzugefügt.</li>
              <li><strong>Update:</strong> Datenbank auf Patch 1.7.0 synchronisiert.</li>
            </ul>

            <ul v-else-if="browserLang === 'es'">
              <li><strong>Nuevo:</strong> 📜 ¡Rastreador de Misiones! Marca misiones como completadas.</li>
              <li><strong>Feature:</strong> Tutorial para nuevos usuarios.</li>
              <li><strong>Actualización:</strong> Base de datos sincronizada con el parche 1.7.0.</li>
            </ul>

            <ul v-else>
              <li><strong>New:</strong> 📜 Quest Tracker! Mark quests as completed.</li>
              <li><strong>Feature:</strong> Added tutorial for new users.</li>
              <li><strong>Update:</strong> Database synced to Patch 1.7.0.</li>
            </ul>
          </div>

        </div>
      </details>
      <div class="legal-links">
        <router-link to="/datenschutz">Privacy Policy (Datenschutz)</router-link> |
        <router-link to="/impressum">Imprint (Impressum)</router-link> |

        <a href="https://docs.google.com/forms/d/e/1FAIpQLScB29rIVFfq4Ph26HguDd7_ObpGSQmK09sf5VcMtsxzLr6lMQ/viewform"
          target="_blank" rel="noopener">
          <span v-if="browserLang === 'de'">🐛 Fehler melden</span>
          <span v-else-if="browserLang === 'es'">🐛 Reportar error</span>
          <span v-else>🐛 Report Bug / Mistake</span>
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