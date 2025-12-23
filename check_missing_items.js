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

// HIER IST DIE NEUE URL
const WIKI_URL = 'https://arcraiders.wiki/wiki/Category:Recyclable';
const INPUT_FILE = 'loot_data_with_quests.json';
const OUTPUT_TXT = 'missing_recyclables.txt'; // Neue Ausgabedatei

async function checkMissingRecyclables() {
    console.log('🚀 Starte Abgleich mit Wiki Category:Recyclable...');

    // 1. Lokale Daten laden
    const jsonPath = path.join(__dirname, INPUT_FILE);
    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ Datei nicht gefunden: ${INPUT_FILE}`);
        return;
    }
    const lootData = require(jsonPath);

    // Set mit lokalen Namen erstellen (lowercase)
    const localItemNames = new Set(
        lootData
            .filter(i => i.name_en)
            .map(i => i.name_en.toLowerCase().trim())
    );

    console.log(`📂 Lokale Datenbank enthält ${localItemNames.size} Items.`);

    try {
        // 2. Wiki laden
        console.log(`📥 Lade ${WIKI_URL}...`);
        const { data } = await axios.get(WIKI_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(data);

        // 3. Wiki Items extrahieren
        const wikiItems = [];

        // Selektor für MediaWiki Kategorien
        $('.mw-category-group li a').each((i, el) => {
            const itemName = $(el).text().trim();
            // Filtert Kategorien-Links raus
            if (itemName && !itemName.startsWith('Category:')) {
                wikiItems.push(itemName);
            }
        });

        console.log(`🌐 Wiki listet ${wikiItems.length} Recyclables auf.`);
        console.log('------------------------------------------------');

        // 4. Abgleich
        const missingItems = [];

        wikiItems.forEach(wikiName => {
            const checkName = wikiName.toLowerCase().trim();

            // Exakter Check
            if (!localItemNames.has(checkName)) {
                // Singular Check (falls Wiki "Bottles" sagt, wir aber "Bottle" haben)
                const singularName = checkName.endsWith('s') ? checkName.slice(0, -1) : checkName;

                if (!localItemNames.has(singularName)) {
                    missingItems.push(wikiName);
                }
            }
        });

        // 5. Ergebnis
        if (missingItems.length === 0) {
            console.log('✅ Perfekt! Keine fehlenden Recyclables gefunden.');
        } else {
            console.log(`⚠️  ACHTUNG: ${missingItems.length} Recyclables fehlen in deiner JSON!`);
            console.log('------------------------------------------------');
            missingItems.forEach(name => console.log(` - ${name}`));
            console.log('------------------------------------------------');

            const fileContent = `Fehlende Recyclables (Wiki Abgleich):\n\n` + missingItems.join('\n');
            fs.writeFileSync(path.join(__dirname, OUTPUT_TXT), fileContent, 'utf-8');
            console.log(`📄 Liste gespeichert in: ${OUTPUT_TXT}`);
        }

    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Wiki:', error.message);
    }
}

checkMissingRecyclables();