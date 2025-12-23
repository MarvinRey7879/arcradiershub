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

const CATEGORY_URL = 'https://arcraiders.wiki/wiki/Category:Trinket';
const WIKI_BASE_URL = 'https://arcraiders.wiki';
const INPUT_FILE = 'loot_data_with_quests.json';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkTrinketRarity() {
    console.log('🚀 Starte verbesserten Rarity-Check (V2)...');

    // 1. Lokale Daten laden
    const jsonPath = path.join(__dirname, INPUT_FILE);
    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ Datei nicht gefunden: ${INPUT_FILE}`);
        return;
    }
    const lootData = require(jsonPath);

    const localItemsMap = new Map();
    lootData.forEach(item => {
        if (item.name_en) {
            localItemsMap.set(item.name_en.toLowerCase().trim(), item);
        }
    });

    try {
        // 2. Kategorie laden
        console.log(`📥 Lade Kategorie: ${CATEGORY_URL}...`);
        const { data } = await axios.get(CATEGORY_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);

        const itemLinks = [];
        $('.mw-category-group li a').each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).text().trim();
            if (link && title && !title.startsWith('Category:')) {
                itemLinks.push({ title, url: `${WIKI_BASE_URL}${link}` });
            }
        });

        console.log(`🔍 ${itemLinks.length} Items gefunden. Starte Deep Scan...`);
        console.log('------------------------------------------------');

        let matchCount = 0;
        let mismatchCount = 0;
        let missingCount = 0;

        for (const itemLink of itemLinks) {
            const wikiName = itemLink.title;

            try {
                const { data: itemData } = await axios.get(itemLink.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const $item = cheerio.load(itemData);

                // --- VERBESSERTE RARITY ERKENNUNG ---
                let wikiRarity = 'Unknown';

                // Strategie 1: Suche nach Links zu Rarity-Kategorien (sehr sicher)
                // Sucht nach <a href="/wiki/Category:Rare"> oder ähnlich
                for (const rarity of RARITIES) {
                    // Prüfe auf Links die "Category:Rarity" enthalten oder Text "Rarity"
                    const hasCategoryLink = $item(`a[href*="Category:${rarity}"]`).length > 0;
                    const hasTextLink = $item(`a[title="Category:${rarity}"]`).length > 0;

                    // Prüfe Infobox spezifisch (oft unter dem Bild als Text)
                    const infoboxText = $item('.infobox').text();
                    const hasInfoboxMention = infoboxText.includes(rarity);

                    if (hasCategoryLink || hasTextLink || hasInfoboxMention) {
                        wikiRarity = rarity;
                        break; // Gefunden, Abbruch
                    }
                }

                // --- Abgleich ---
                const localItem = localItemsMap.get(wikiName.toLowerCase());

                if (!localItem) {
                    console.log(`⚠️  [${wikiName}] FEHLT lokal (Wiki: ${wikiRarity})`);
                    missingCount++;
                } else {
                    const localRarity = localItem.rarity;

                    if (wikiRarity === 'Unknown') {
                        console.log(`❓ [${wikiName}] Rarity im Wiki nicht erkannt.`);
                    } else if (wikiRarity.toLowerCase() === localRarity.toLowerCase()) {
                        console.log(`✅ [${wikiName}] Stimmt (${localRarity})`);
                        matchCount++;
                    } else {
                        console.log(`❌ [${wikiName}] UNTERSCHIED! Wiki: "${wikiRarity}" vs. Lokal: "${localRarity}"`);
                        mismatchCount++;
                    }
                }

            } catch (err) {
                console.error(`❌ Fehler bei ${wikiName}: ${err.message}`);
            }

            await sleep(100); // Kurze Pause
        }

        console.log('------------------------------------------------');
        console.log(`Ergebnis: ✅ ${matchCount} | ❌ ${mismatchCount} | ⚠️ ${missingCount} fehlen`);

    } catch (error) {
        console.error('❌ Fehler:', error.message);
    }
}

checkTrinketRarity();