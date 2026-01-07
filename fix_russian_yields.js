import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- KONFIGURATION ---
const INPUT_FILE = 'loot_data_final.json'; // Deine aktuelle Datei mit den Fehlern
const OUTPUT_FILE = 'loot_data_final_fixed.json'; // Die reparierte Datei

// Statische Übersetzungen für nicht-Item Begriffe
const STATIC_TRANSLATIONS = {
    'Workshop': 'Мастерская',
    'Expedition': 'Экспедиция',
    'Quest': 'Квест', // Oder "Задание"
    'Currency for Celeste': 'Валюта для Селесты',
    'Scrappy': 'Плюшкин'
};

async function fixRussianYields() {
    console.log("🛠️ Starte Reparatur der russischen Yields...");

    // 1. Datei laden
    const rawData = fs.readFileSync(path.join(__dirname, INPUT_FILE), 'utf-8');
    const lootData = JSON.parse(rawData);

    // 2. Wörterbuch erstellen (Englischer Name -> Russischer Name)
    // Wir nutzen die Daten, die du schon gescrapet hast!
    const itemMap = {};

    lootData.forEach(item => {
        if (item.name_en && item.name_ru) {
            // Normalisieren: Kleinbuchstaben für besseres Matching
            itemMap[item.name_en.toLowerCase()] = item.name_ru;
        }
    });

    // Manuelle Ergänzungen für Plural/Singular Probleme, falls nötig
    itemMap['battery'] = 'Батарея';
    itemMap['sensor'] = 'Датчики';

    let fixedCount = 0;

    // 3. Durch die Items iterieren und yield_ru neu bauen
    const fixedData = lootData.map(item => {
        // Wenn kein englischer Yield existiert, muss auch der russische null sein
        if (!item.yield_en) {
            return {
                ...item,
                yield_ru: null
            };
        }

        // yield_en splitten (z.B. "5x Workshop, 1x Metal Parts")
        const parts = item.yield_en.split(',').map(p => p.trim());

        const translatedParts = parts.map(part => {
            // Regex: Findet "5x " am Anfang
            const match = part.match(/^(\d+x)\s+(.+)$/);

            if (!match) return part; // Fallback, falls Format komisch ist

            const amount = match[1]; // "5x"
            const nameEn = match[2]; // "Workshop" oder "Metal Parts"
            const nameEnLower = nameEn.toLowerCase();

            // A. Suche in statischen Übersetzungen
            if (STATIC_TRANSLATIONS[nameEn]) {
                return `${amount} ${STATIC_TRANSLATIONS[nameEn]}`;
            }

            // B. Suche in der Item-Map (von deinem Scrape)
            if (itemMap[nameEnLower]) {
                return `${amount} ${itemMap[nameEnLower]}`;
            }

            // C. Fallback: Singular versuchen (manchmal steht im Yield Plural)
            if (nameEnLower.endsWith('s') && itemMap[nameEnLower.slice(0, -1)]) {
                return `${amount} ${itemMap[nameEnLower.slice(0, -1)]}`;
            }

            // D. Notfall: Englischen Namen behalten, aber loggen
            console.warn(`⚠️ Keine Übersetzung gefunden für: "${nameEn}" (in Item: ${item.name_en})`);
            return `${amount} ${nameEn}`;
        });

        const newYieldRu = translatedParts.join(', ');

        // Nur loggen, wenn sich was ändert (und es nicht vorher null war)
        if (item.yield_ru !== newYieldRu) {
            fixedCount++;
        }

        return {
            ...item,
            yield_ru: newYieldRu
        };
    });

    // 4. Speichern
    fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), JSON.stringify(fixedData, null, 2));

    console.log(`\n✅ Fertig! ${fixedCount} Einträge korrigiert/generiert.`);
    console.log(`💾 Gespeichert in: ${OUTPUT_FILE}`);
}

fixRussianYields();