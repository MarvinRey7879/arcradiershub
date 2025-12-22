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
const INPUT_FILE = 'loot_data_de_en_fr.json'; // Deine Originaldatei
const OUTPUT_DATA_FILE = 'loot_data_with_quests.json'; // Die neue DB für Vue
const OUTPUT_QUEST_LIST = 'quest_list.json'; // Für den Filter

// --- HAUPTFUNKTION ---
async function scrapeQuests() {
    console.log('🚀 Starte verbesserten Quest Scraper...');

    // 1. Loot Daten laden
    const lootDataPath = path.join(__dirname, INPUT_FILE);
    if (!fs.existsSync(lootDataPath)) {
        console.error(`❌ Datei nicht gefunden: ${INPUT_FILE}`);
        return;
    }
    const lootData = require(lootDataPath);

    // Reset: Alle Quests in den Items leeren
    lootData.forEach(item => item.quests = []);

    try {
        // 2. Wiki laden
        console.log(`📥 Lade ${WIKI_URL}...`);
        const { data } = await axios.get(WIKI_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);

        // 3. Tabelle verarbeiten
        const tableRows = $('table.wikitable tr').slice(1);
        console.log(`📊 ${tableRows.length} Quests gefunden. Beginne Matching...`);
        console.log('------------------------------------------------');

        const allQuestsExport = [];

        tableRows.each((index, element) => {
            const tds = $(element).find('td');
            if (tds.length < 5) return;

            // Daten extrahieren
            const questName = $(tds[0]).text().trim();
            const trader = $(tds[1]).text().trim();
            const questId = questName.toLowerCase().replace(/[^a-z0-9]/g, '_');

            // Objective Text säubern: <br> -> Leerzeichen, alles lowercase für suche
            const objectiveCell = $(tds[4]);
            objectiveCell.find('br').replaceWith(' ');
            const rawObjectiveText = objectiveCell.text().replace(/\s+/g, ' ').trim(); // "Obtain 3 Wires Obtain 1 Battery"

            // Objekt für quest_list.json vorbereiten
            const questEntry = {
                id: questId,
                name: questName,
                trader: trader,
                hasObtains: false, // Wird true, wenn wir Items finden
                requiredItems: []  // Liste der Items für den Filter-Tooltip
            };

            // --- REVERSE MATCHING STRATEGIE ---
            // Wir prüfen für JEDES Item in deiner Datenbank, ob es im Text vorkommt.

            let foundItemsForThisQuest = 0;

            lootData.forEach(item => {
                if (!item.name_en) return;

                // Regex bauen:
                // \b = Wortgrenze (damit "Oil" nicht in "Coil" gefunden wird)
                // s? = Optionales Plural-S am Ende
                // i = Case insensitive
                const escapedName = item.name_en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Sonderzeichen escapen
                const regex = new RegExp(`\\b${escapedName}s?\\b`, 'i');

                const match = rawObjectiveText.match(regex);

                if (match) {
                    // Item gefunden! Jetzt versuchen wir die Menge davor zu finden.
                    // Wir suchen im Text VOR dem Match nach einer Zahl.
                    // Index des Matches: match.index
                    const textBefore = rawObjectiveText.substring(0, match.index);

                    // Suche nach der letzten Zahl vor dem Item (z.B. "Obtain 5x " oder "Get 5 ")
                    const qtyMatch = textBefore.match(/(\d+)\s*x?\s*$/);
                    const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

                    // 1. Ins Item schreiben (für die Detailansicht der Karte)
                    item.quests.push({
                        questId: questId,
                        questName: questName,
                        trader: trader,
                        amount: quantity
                    });

                    // 2. In die Quest-Liste schreiben (für den Filter)
                    questEntry.requiredItems.push({
                        id: item.id,
                        name: item.name_en,
                        amount: quantity
                    });
                    questEntry.hasObtains = true;

                    foundItemsForThisQuest++;
                }
            });

            if (foundItemsForThisQuest > 0) {
                console.log(`✅ [${questName}]: ${foundItemsForThisQuest} Items erkannt.`);
                questEntry.requiredItems.forEach(ri => {
                    console.log(`   -> ${ri.amount}x ${ri.name}`);
                });
            }

            allQuestsExport.push(questEntry);
        });

        // 4. Dateien speichern
        fs.writeFileSync(path.join(__dirname, OUTPUT_DATA_FILE), JSON.stringify(lootData, null, 2));
        fs.writeFileSync(path.join(__dirname, OUTPUT_QUEST_LIST), JSON.stringify(allQuestsExport, null, 2));

        console.log('------------------------------------------------');
        console.log(`🎉 Fertig!`);
        console.log(`Datei gespeichert: ${OUTPUT_DATA_FILE}`);
        console.log(`Datei gespeichert: ${OUTPUT_QUEST_LIST}`);

    } catch (error) {
        console.error('❌ Kritischer Fehler:', error);
    }
}

scrapeQuests();