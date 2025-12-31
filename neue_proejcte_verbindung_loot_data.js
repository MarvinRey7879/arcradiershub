import fs from 'fs';

// --- KONFIGURATION ---
const LOOT_FILE = 'loot_data_final.json';
const PROJECT_FILE = 'project_list_final.json';

const OUTPUT_LOOT = 'loot_data_synced.json';
const OUTPUT_PROJECT = 'project_list_synced.json';

// Hilfsfunktion zum Normalisieren von Namen für den Vergleich
// (Macht alles klein und entfernt Leerzeichen am Rand, um " Soft Drink " == "soft drink" zu matchen)
function normalize(str) {
    if (!str) return "";
    return str.toLowerCase().trim();
}

async function smartSync() {
    console.log("🚀 Starte Smart-Sync (Name-Matching)...");

    let lootData = [];
    let projectList = [];

    try {
        lootData = JSON.parse(fs.readFileSync(LOOT_FILE, 'utf8'));
        projectList = JSON.parse(fs.readFileSync(PROJECT_FILE, 'utf8'));
    } catch (e) {
        console.error("❌ Fehler beim Lesen der Dateien:", e.message);
        return;
    }

    // 1. LOOT-DATEN VORBEREITEN
    // a) Alte Projekt-Quests löschen (Cleanup)
    console.log("🧹 Bereinige Loot-Daten von alten Projekt-Quests...");
    lootData.forEach(item => {
        if (item.quests) {
            item.quests = item.quests.filter(q => q.trader !== "Project" && q.trader !== "Event");
        } else {
            item.quests = [];
        }
    });

    // b) Such-Maps erstellen (für extrem schnellen Zugriff)
    // Wir wollen Items finden über ID ODER über den englischen Namen
    const lootById = new Map();
    const lootByName = new Map();

    lootData.forEach(item => {
        lootById.set(item.id, item);
        if (item.name_en) {
            lootByName.set(normalize(item.name_en), item);
        }
    });

    // 2. PROJEKTE DURCHGEHEN UND MATCHEN
    console.log("🔄 Synchronisiere...");
    let matchedCount = 0;
    let fixedIdsCount = 0;
    let missingItems = new Set();

    projectList.forEach(project => {
        if (!project.requiredItems) return;

        project.requiredItems.forEach(reqItem => {
            // Schritt A: Versuchen, das Item in der Loot-Liste zu finden
            // 1. Versuch: Über die ID
            let foundItem = lootById.get(reqItem.id);

            // 2. Versuch: Über den Namen (Falls ID falsch/anders generiert wurde)
            if (!foundItem && reqItem.name) {
                foundItem = lootByName.get(normalize(reqItem.name));

                if (foundItem) {
                    // AHA! Wir haben das Item über den Namen gefunden, aber die ID war anders.
                    // Beispiel: Project hatte ID "advanced_electrical_components", aber Loot hat "adv_elec_comp"
                    // -> Wir korrigieren die ID in der Projekt-Liste!
                    /* console.log(`   🔧 Fix ID: "${reqItem.id}" -> "${foundItem.id}" (${reqItem.name})`); */
                    reqItem.id = foundItem.id; // Das updated das Objekt in 'projectList' direkt
                    fixedIdsCount++;
                }
            }

            // Schritt B: Wenn gefunden, verlinken
            if (foundItem) {
                // Eintrag für Loot-Liste erstellen
                const questEntry = {
                    questId: project.id,
                    questName: project.name_en,
                    trader: project.trader,
                    amount: reqItem.amount
                };

                // Push in Loot-Data
                foundItem.quests.push(questEntry);
                matchedCount++;
            } else {
                // Weder über ID noch Name gefunden
                missingItems.add(`${reqItem.id} (Name: ${reqItem.name})`);
            }
        });
    });

    // 3. STATISTIK & SPEICHERN
    console.log(`\n📊 Ergebnisse:`);
    console.log(`   ✅ Verknüpfungen erstellt: ${matchedCount}`);
    console.log(`   🔧 Reparierte IDs in Projekt-Liste: ${fixedIdsCount}`);

    if (missingItems.size > 0) {
        console.warn("\n⚠️  WARNUNG: Folgende Items konnten NICHT gefunden werden (Weder per ID noch per Name):");
        missingItems.forEach(m => console.warn(`   ❌ ${m}`));
    } else {
        console.log("\n✨ Perfekt! Alle Items wurden gefunden.");
    }

    // Speichern
    fs.writeFileSync(OUTPUT_LOOT, JSON.stringify(lootData, null, 2));
    console.log(`💾 Loot-Daten gespeichert: ${OUTPUT_LOOT}`);

    fs.writeFileSync(OUTPUT_PROJECT, JSON.stringify(projectList, null, 2));
    console.log(`💾 Projekt-Liste gespeichert: ${OUTPUT_PROJECT} (mit korrigierten IDs)`);
}

smartSync();