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
    console.log('🚀 Starte KORRIGIERTEN Quest Scraper (Objective Column)...');

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
        console.log(`📊 ${tableRows.length} Quests gefunden. Analysiere 'Objective' Spalte...`);
        console.log('------------------------------------------------');

        const allQuestsExport = [];

        tableRows.each((index, element) => {
            const tds = $(element).find('td');
            if (tds.length < 5) return;

            // Daten extrahieren
            const questName = $(tds[0]).text().trim();
            const trader = $(tds[1]).text().trim();
            const questId = questName.toLowerCase().replace(/[^a-z0-9]/g, '_');

            // --- KORREKTUR HIER ---
            // Wir lesen jetzt Spalte Index 3 (Objective), NICHT Index 4 (Reward)
            // Struktur: Quest(0) | Trader(1) | Location(2) | Objective(3) | Reward(4)
            const objectiveCell = $(tds[3]);

            // HTML bearbeiten: <br> durch Leerzeichen ersetzen
            objectiveCell.find('br').replaceWith(' ');
            // Text säubern
            const rawObjectiveText = objectiveCell.text().replace(/\s+/g, ' ').trim();

            // Objekt für quest_list.json vorbereiten
            const questEntry = {
                id: questId,
                name: questName,
                trader: trader,
                hasObtains: false,
                requiredItems: []
            };

            // --- REVERSE MATCHING STRATEGIE ---
            let foundItemsForThisQuest = 0;

            lootData.forEach(item => {
                if (!item.name_en) return;

                // Regex bauen: Item Name finden (auch Plural)
                const escapedName = item.name_en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedName}s?\\b`, 'i');

                const match = rawObjectiveText.match(regex);

                if (match) {
                    // Item im "Objective" Text gefunden!

                    // Suche Menge davor (z.B. "Obtain 3 Wires" oder "Get 1x Battery")
                    const textBefore = rawObjectiveText.substring(0, match.index);
                    const qtyMatch = textBefore.match(/(\d+)\s*x?\s*$/);
                    const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

                    // Nur hinzufügen, wenn es sich nach einer Beschaffungs-Mission anhört
                    // (Wir filtern false positives, falls der Item Name zufällig in einem Satz vorkommt, aber keine Zahl davor steht)
                    // Optional: Man könnte hier auch prüfen, ob Wörter wie "Obtain", "Get", "Loot" in der Nähe sind.
                    // Aber die Zahl davor ist meistens der beste Indikator.

                    // 1. Ins Item schreiben
                    // Prüfen ob Quest schon drin ist (vermeidet Duplikate wenn Item mehrfach genannt wird)
                    const existingQuestInItem = item.quests.find(q => q.questId === questId);
                    if (!existingQuestInItem) {
                        item.quests.push({
                            questId: questId,
                            questName: questName,
                            trader: trader,
                            amount: quantity
                        });
                    }

                    // 2. In die Quest-Liste schreiben
                    const existingReqInList = questEntry.requiredItems.find(ri => ri.id === item.id);
                    if (!existingReqInList) {
                        questEntry.requiredItems.push({
                            id: item.id,
                            name: item.name_en,
                            amount: quantity
                        });
                        questEntry.hasObtains = true;
                        foundItemsForThisQuest++;
                    }
                }
            });

            if (foundItemsForThisQuest > 0) {
                console.log(`✅ [${questName}]: ${foundItemsForThisQuest} Items benötigt.`);
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
        console.log(`Datenbank aktualisiert: ${OUTPUT_DATA_FILE}`);
        console.log(`Quest-Liste erstellt: ${OUTPUT_QUEST_LIST}`);

    } catch (error) {
        console.error('❌ Fehler:', error.message);
    }
}

scrapeQuests();