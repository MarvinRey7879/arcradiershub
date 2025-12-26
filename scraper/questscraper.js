import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// --- SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const WIKI_URL = 'https://arcraiders.wiki/wiki/Quests';
const INPUT_FILE = 'loot_data_de_en_fr.json';
const OUTPUT_FILE = 'loot_data_with_quests.json';
const QUEST_LIST_FILE = 'quest_list.json';

// --- HAUPTFUNKTION ---
async function scrapeQuests() {
    console.log('🚀 Starte Quest Scraper...');

    // 1. Lade existierende Loot-Daten
    const lootDataPath = path.join(__dirname, INPUT_FILE);
    if (!fs.existsSync(lootDataPath)) {
        console.error(`❌ Datei nicht gefunden: ${INPUT_FILE}`);
        return;
    }
    const lootData = require(lootDataPath);

    // Füge jedem Item ein leeres 'quests' Array hinzu
    lootData.forEach(item => item.quests = []);

    // Erstelle eine Lookup-Map für schnelleres Finden (Name -> Item Object)
    const itemLookup = {};
    lootData.forEach(item => {
        if (item.name_en) {
            itemLookup[item.name_en.toLowerCase().trim()] = item;
        }
    });

    try {
        // 2. Wiki Seite laden
        console.log(`📥 Lade ${WIKI_URL}...`);
        const { data } = await axios.get(WIKI_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(data);

        // 3. Tabelle parsen
        const tableRows = $('table.wikitable tr').slice(1); // Header überspringen
        console.log(`📊 ${tableRows.length} Quests gefunden. Analysiere Ziele...`);

        const allQuests = []; // Liste für den Frontend-Filter

        tableRows.each((index, element) => {
            const tds = $(element).find('td');
            if (tds.length < 5) return;

            const questName = $(tds[0]).text().trim();
            const trader = $(tds[1]).text().trim();

            // Objective Cell bearbeiten: <br> durch \n ersetzen für sauberes Splitten
            const objectiveCell = $(tds[4]);
            objectiveCell.find('br').replaceWith('\n');
            const objectivesText = objectiveCell.text();

            // Quest ID generieren (für checkboxen)
            const questId = questName.toLowerCase().replace(/[^a-z0-9]/g, '_');

            // Quest zur Liste hinzufügen
            allQuests.push({ id: questId, name: questName, trader: trader });

            // 4. Regex Matching für Items
            // Sucht nach: (Obtain/Loot/Get/...) (Menge x?) (Item Name)
            // Bsp: "Obtain 3 Wires" oder "Get 1x Syringe"
            const lines = objectivesText.split('\n');
            const pattern = /(?:Obtain|Loot|Get|Deliver|Collect|Extract)\s+(\d+x?)\s+(.+)/i;

            lines.forEach(line => {
                const match = line.trim().match(pattern);
                if (match) {
                    let qty = parseInt(match[1].toLowerCase().replace('x', ''));
                    let itemNameRaw = match[2].trim();

                    // Bereinigung des Namens (manchmal steht Zeug dahinter)
                    // Wir versuchen Match mit Lookup
                    let targetItem = findItem(itemNameRaw, itemLookup);

                    if (targetItem) {
                        // Checken ob Quest schon eingetragen (Duplikate vermeiden)
                        const exists = targetItem.quests.find(q => q.id === questId);
                        if (!exists) {
                            targetItem.quests.push({
                                id: questId,
                                name: questName,
                                trader: trader,
                                amount: qty
                            });
                        }
                    }
                }
            });
        });

        // 5. Speichern
        fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), JSON.stringify(lootData, null, 2));
        fs.writeFileSync(path.join(__dirname, QUEST_LIST_FILE), JSON.stringify(allQuests, null, 2));

        // Statistik
        const itemsWithQuests = lootData.filter(i => i.quests.length > 0).length;
        console.log('------------------------------------------------');
        console.log(`✅ Fertig!`);
        console.log(`💾 ${OUTPUT_FILE} erstellt (Datenbank mit Quests).`);
        console.log(`💾 ${QUEST_LIST_FILE} erstellt (Liste aller Quests).`);
        console.log(`🔗 ${itemsWithQuests} Items wurden mit Quests verknüpft.`);

    } catch (error) {
        console.error('❌ Fehler:', error.message);
    }
}

// Hilfsfunktion: Versucht Item zu finden (handelt Plural "s")
function findItem(rawName, lookup) {
    const key = rawName.toLowerCase().trim();

    // 1. Exakter Match
    if (lookup[key]) return lookup[key];

    // 2. Singular Versuch (Wires -> Wire)
    if (key.endsWith('s')) {
        const singular = key.slice(0, -1);
        if (lookup[singular]) return lookup[singular];
    }

    // 3. Fallback: "item parts" -> "item part" oder umgekehrt
    // Hier könnte man noch komplexere Logik einbauen, falls nötig

    return null;
}

scrapeQuests();