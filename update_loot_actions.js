import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// --- KONFIGURATION ---
const INPUT_FILE = 'loot_data_v6.json'; // Deine gewünschte Input-Datei
const OUTPUT_FILE = 'loot_data_test_result.json';
const WIKI_BASE_URL = 'https://arcraiders.wiki/wiki/';

// --- VALID HEADERS (Strict Mode) ---
// Nur wenn eine dieser Überschriften existiert, wird das Item "KEEP"
const VALID_HEADERS = [
    'Crafting',
    'Workshop Upgrade',
    'Workshop',
    'Recipes',
    'Used in',
    'Used for',
    'Usage',
    'Contract'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTestScraper() {
    console.log(`🚀 Starte Test-Scraper mit Input: ${INPUT_FILE}...`);

    const jsonPath = path.join(__dirname, INPUT_FILE);
    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ Fehler: Datei ${INPUT_FILE} nicht gefunden! Bitte stelle sicher, dass sie existiert.`);
        return;
    }

    const lootData = require(jsonPath);
    let changesCount = 0;

    for (let i = 0; i < lootData.length; i++) {
        const item = lootData[i];

        // Sicherheitscheck: Hat das Item einen englischen Namen?
        if (!item.name_en) continue;

        // 1. URL strikt generieren: Name + Leerzeichen zu Underscore
        const wikiName = item.name_en.trim().replace(/ /g, '_');
        const url = `${WIKI_BASE_URL}${wikiName}`;

        // Optional: Kleines Logging, damit du siehst, welche URL er gerade prüft
        // console.log(`🔎 Prüfe: ${url}`); 

        try {
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                validateStatus: status => status < 500 // 404 nicht abstürzen lassen
            });

            if (typeof data !== 'string') {
                console.warn(`⚠️  Seite nicht gefunden (404): ${url}`);
                continue;
            }

            const $ = cheerio.load(data);
            const categories = $('#mw-normal-catlinks').text();

            let isImportant = false;
            let foundReason = "";

            // 2. STRICT CHECK: Suche nur in Überschriften (h2, h3)
            $('h2, h3').each((_, element) => {
                const headlineText = $(element).text().trim();
                const headlineID = $(element).attr('id') || "";

                // Prüfen, ob einer unserer erlaubten Begriffe darin vorkommt
                for (const validHeader of VALID_HEADERS) {
                    // Wir prüfen Text UND ID, um sicherzugehen
                    if (headlineText.includes(validHeader) || headlineID.includes(validHeader.replace(/ /g, '_'))) {
                        isImportant = true;
                        foundReason = `Gefundene Sektion: "${headlineText}"`;
                        return false; // Schleife abbrechen, wir haben einen Treffer
                    }
                }
            });

            // Fallback: Wiki-Kategorie "Crafting Material" (sehr verlässlich)
            if (!isImportant && categories.includes('Crafting Material')) {
                isImportant = true;
                foundReason = "Wiki-Kategorie: Crafting Material";
            }

            // 3. ACTION BESTIMMEN
            let newAction = item.action;

            if (isImportant) {
                newAction = 'keep';
            } else {
                // Wenn KEINE wichtige Überschrift gefunden wurde:
                // Strikte Regeln basierend auf der lokalen Kategorie.

                if (item.category === 'Trinket') {
                    newAction = 'sell';
                } else if (item.category === 'Recyclable') {
                    newAction = 'recycle';
                } else if (item.category === 'Topside Material' || item.category === 'Basic Material') {
                    newAction = 'keep'; // Materialien sicherheitshalber behalten
                } else if (item.category === 'Nature') {
                    newAction = 'keep'; // Essen/Meds
                }
            }

            // 4. LOGGING (Nur Änderungen)
            if (item.action !== newAction) {
                console.log(`🔄 ÄNDERUNG bei [${item.name_en}] (${url}):`);
                console.log(`   Alt: ${item.action.toUpperCase()} -> Neu: ${newAction.toUpperCase()}`);
                console.log(`   Grund: ${isImportant ? foundReason : `Keine relevante Sektion -> ${item.category}`}`);
                console.log('------------------------------------------------');
                item.action = newAction;
                changesCount++;
            }

        } catch (error) {
            console.error(`❌ Fehler bei ${url}: ${error.message}`);
        }

        await sleep(50); // Server schonen
    }

    // Speichern
    fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), JSON.stringify(lootData, null, 2), 'utf-8');
    console.log(`✅ Fertig! ${changesCount} Items aktualisiert.`);
    console.log(`💾 Ergebnis gespeichert in: ${OUTPUT_FILE}`);
}

runTestScraper();