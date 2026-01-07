import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n' // Importieren
// Realtime DB Imports
import { rtdb } from './firebase'
import { ref, runTransaction } from "firebase/database";

const app = createApp(App)
app.use(i18n) // Benutzen
app.use(createPinia())
app.use(router)

// --- ZÄHLER LOGIK START ---
function trackUserVisit() {
    // 1. Session Check: Wenn in diesem Tab schon gezählt wurde, abbrechen
    if (sessionStorage.getItem('session_counted')) {
        return;
    }

    // 2. Prüfen: War der User schon mal da?
    const hasVisitedBefore = localStorage.getItem('has_visited_before');

    // Referenzen zur Datenbank
    const returningRef = ref(rtdb, 'stats/returning_users');
    const newRef = ref(rtdb, 'stats/new_users');
    const totalRef = ref(rtdb, 'stats/total_visits');

    // 3. Unterscheidung Neu vs. Wiederkehrend
    if (hasVisitedBefore) {
        // Wiederkehrender Besucher (+1)
        runTransaction(returningRef, (current) => (current || 0) + 1);
    } else {
        // Neuer Besucher (+1)
        runTransaction(newRef, (current) => (current || 0) + 1)
            .then(() => {
                // Erst wenn Datenbank-Update erfolgreich war, im Browser speichern
                localStorage.setItem('has_visited_before', 'true');
            });
    }

    // 4. Gesamt-Zähler immer erhöhen (+1)
    runTransaction(totalRef, (current) => (current || 0) + 1)
        .then(() => {
            // Markieren, dass diese Session gezählt wurde
            sessionStorage.setItem('session_counted', 'true');
        });
}

// Zähler starten
trackUserVisit();
// --- ZÄHLER LOGIK ENDE ---

app.mount('#app')