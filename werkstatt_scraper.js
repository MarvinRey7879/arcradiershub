import puppeteer from 'puppeteer';
import fs from 'fs';

// --- KONFIGURATION ---
const LOOT_DATA_FILE = 'loot_data_final.json';
const OUTPUT_FILE = 'hideout_data_final.json';
const TARGET_URL = 'https://arctracker.io/de/hideout';

// NUR diese Stationen werden gescrapt (Lager wird ignoriert!)
const ALLOWED_STATIONS = [
    "Ausrüstungsbank",
    "Sprengstoffstation",
    "Medizinisches Labor",
    "Veredler",
    "Scrappy",
    "Waffenstation",
    "Gebrauchsgegenstand-Station"
];

// Selektoren
const CARD_SELECTOR = 'div[data-slot="card"]';
const HEADER_TEXT_SELECTOR = 'div[data-slot="card-header"] span';
const REQ_LIST_SELECTOR = 'ul li';
const UPGRADE_BUTTON_SELECTOR = 'button[data-slot="button"]';
const MAX_LEVEL_SELECTOR = '.text-green-400';

// 1. JSON laden und Map erstellen: "Deutscher Name" -> "ID"
function loadItemLookup() {
    try {
        const rawData = fs.readFileSync(LOOT_DATA_FILE, 'utf8');
        const data = JSON.parse(rawData);
        const lookup = {};

        data.forEach(item => {
            if (item.name_de) {
                // Wir speichern den Namen lowerCase für besseren Vergleich
                lookup[item.name_de.toLowerCase().trim()] = item.id;
            }
        });
        return lookup;
    } catch (error) {
        console.error(`❌ Fehler beim Laden von ${LOOT_DATA_FILE}:`, error);
        process.exit(1);
    }
}

async function scrapeHideout() {
    const itemLookup = loadItemLookup(); // Map: Name -> ID
    console.log(`✅ ${Object.keys(itemLookup).length} Items für Namensvergleich geladen.`);

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();

    console.log(`🌍 Navigiere zu ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    // Alle Karten holen
    const stationCount = await page.$$eval(CARD_SELECTOR, els => els.length);
    console.log(`🔍 Gefundene Karten auf der Seite: ${stationCount}`);

    const resultData = [];

    for (let i = 0; i < stationCount; i++) {
        const currentCardSelector = `${CARD_SELECTOR}:nth-child(${i + 1})`;

        // Header Text holen (z.B. "Ausrüstungsbank - Level 0")
        let headerText = "";
        try {
            headerText = await page.$eval(`${currentCardSelector} ${HEADER_TEXT_SELECTOR}`, el => el.innerText.trim());
        } catch (e) { continue; }

        const stationName = headerText.split(' - ')[0].trim();

        // ⚠️ FILTER: Ist die Station in deiner erlaubten Liste?
        if (!ALLOWED_STATIONS.includes(stationName)) {
            console.log(`   ⏭️ Ignoriere: "${stationName}" (Nicht in der Liste)`);
            continue;
        }

        // ID generieren für die Station selbst (für den Output)
        const stationId = stationName.toLowerCase()
            .replace(/ü/g, 'ue').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]/g, '_');

        console.log(`\n📍 Scrape Station: ${stationName}`);

        let stationData = {
            id: stationId,
            name_de: stationName,
            levels: []
        };

        let isMaxLevel = false;
        let loopSafety = 0;

        while (!isMaxLevel && loopSafety < 10) {
            loopSafety++;

            // 1. Check Max Level
            const maxLevelEl = await page.$(`${currentCardSelector} ${MAX_LEVEL_SELECTOR}`);
            if (maxLevelEl) {
                console.log(`      🏁 Max Level erreicht.`);
                isMaxLevel = true;
                break;
            }

            // 2. Aktuellen Button Text holen (um Level zu bestimmen)
            const buttonEl = await page.$(`${currentCardSelector} ${UPGRADE_BUTTON_SELECTOR}`);
            if (!buttonEl) break; // Sollte nicht passieren wenn nicht max level

            const buttonText = await page.evaluate(el => el.innerText, buttonEl); // "Aufwerten auf Level 1"
            const levelMatch = buttonText.match(/Level\s+(\d+)/);
            const targetLevel = levelMatch ? parseInt(levelMatch[1], 10) : loopSafety;

            console.log(`      ➡️ ${buttonText}`);

            // 3. Items auslesen (Per Name!)
            const requirements = await page.evaluate((cardSel, listSel, lookupMap) => {
                const lis = document.querySelectorAll(`${cardSel} ${listSel}`);
                const reqs = [];

                lis.forEach(li => {
                    // Wir suchen nach dem Text im <a> Tag oder im <span>
                    // Struktur: <a><span>50x Plastikteile</span></a>
                    const textEl = li.innerText.trim(); // "50x Plastikteile\n(0/50)"
                    // Wir nehmen nur die erste Zeile vor dem Zeilenumbruch
                    const cleanText = textEl.split('\n')[0].trim(); // "50x Plastikteile"

                    const match = cleanText.match(/^(\d+)x\s+(.+)$/);
                    if (match) {
                        const amount = parseInt(match[1], 10);
                        const nameDe = match[2].trim();
                        const lookupKey = nameDe.toLowerCase();

                        // Wir geben den Namen zurück, ID suchen wir in Node.js (sicherer)
                        reqs.push({
                            name_found: nameDe,
                            amount: amount,
                            lookupKey: lookupKey
                        });
                    }
                });
                return reqs;
            }, currentCardSelector, REQ_LIST_SELECTOR);

            // 4. IDs zuordnen
            const validReqs = [];
            requirements.forEach(req => {
                const foundId = itemLookup[req.lookupKey];
                if (foundId) {
                    validReqs.push({
                        id: foundId,
                        // name: req.name_found, // Optional: Wenn du den Namen auch im Output willst
                        amount: req.amount
                    });
                } else {
                    console.warn(`         ⚠️ WARNUNG: Kein Item in JSON gefunden für: "${req.name_found}"`);
                }
            });

            stationData.levels.push({
                level: targetLevel,
                requiredItems: validReqs
            });

            // 5. Klicken und Warten
            // Wir merken uns den Header Text ("... - Level 0") und warten, bis er sich ändert
            const oldHeaderText = await page.$eval(`${currentCardSelector} ${HEADER_TEXT_SELECTOR}`, el => el.innerText);

            await buttonEl.click();

            try {
                // Warte bis sich der Header Text ändert (z.B. auf "Level 1") ODER Max Level erscheint
                await page.waitForFunction(
                    (selector, maxSelector, oldText) => {
                        const header = document.querySelector(selector);
                        const max = document.querySelector(maxSelector);
                        if (max) return true;
                        return header && header.innerText.trim() !== oldText;
                    },
                    { timeout: 5000 },
                    `${currentCardSelector} ${HEADER_TEXT_SELECTOR}`,
                    MAX_LEVEL_SELECTOR,
                    oldHeaderText
                );
                // Kurze Pause für UI-Update
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                console.log(`         ⚠️ Timeout beim Warten. Prüfe Status erneut...`);
            }
        }

        resultData.push(stationData);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultData, null, 2));
    console.log(`\n💾 Fertig! ${resultData.length} Stationen gespeichert in ${OUTPUT_FILE}`);

    await browser.close();
}

scrapeHideout();