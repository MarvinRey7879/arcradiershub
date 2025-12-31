import puppeteer from 'puppeteer';
import fs from 'fs';

// --- KONFIGURATION ---
const BASE_URL = 'https://arctracker.io';
const LANGUAGES = ['en', 'de', 'es', 'ru'];

// Selektoren
const DROPDOWN_TRIGGER = 'button[role="combobox"]';
const DROPDOWN_OPTION = 'div[role="option"]';

// Selektor für den ganzen Block einer Phase (grauer Kasten)
const PHASE_CONTAINER_SELECTOR = 'div.bg-muted\\/30';
// Selektor für den Titel innerhalb des Containers
const PHASE_TITLE_SELECTOR = 'span.text-base.font-semibold';
// Selektor für eine einzelne Item-Karte innerhalb des Containers
const ITEM_CARD_SELECTOR = 'div.bg-card\\/80';

const EXPEDITION_COUNT = 6; // Die ersten 6 sind Expedition

// Config für IDs und Präfixe
const PROJECT_CONFIG = {
    season_2: {
        id_prefix: "expedition_s2",
        name_prefix: { en: "Expedition S2", de: "Expedition S2", es: "Expedición T2", ru: "Экспедиция С2" }
    },
    season_1: {
        id_prefix: "expedition_s1",
        name_prefix: { en: "Expedition S1", de: "Expedition S1", es: "Expedición T1", ru: "Экспедиция С1" }
    },
    flickering: {
        id_prefix: "flickering",
        name_prefix: { en: "Flickering Flames", de: "Flackernde Flammen", es: "Llamas parpadeantes", ru: "Мерцающее пламя" }
    }
};

async function scrapeProjectsWithItems() {
    console.log("🚀 Starte Deep-Scraper (Items + Übersetzungen)...");
    const browser = await puppeteer.launch({ headless: "new" });

    // Datenstruktur: dataStore.season_2[index] = { en: {title, items}, de: {title}, ... }
    let dataStore = {
        season_2: {},
        season_1: {},
        flickering: {}
    };

    try {
        for (const lang of LANGUAGES) {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();

            // 1. Sprache einstellen
            let langHeader = 'en-US';
            if (lang === 'de') langHeader = 'de-DE';
            if (lang === 'es') langHeader = 'es-ES';
            if (lang === 'ru') langHeader = 'ru-RU';
            await page.setExtraHTTPHeaders({ 'Accept-Language': langHeader });

            const url = lang === 'en' ? `${BASE_URL}/projects` : `${BASE_URL}/${lang}/projects`;
            console.log(`\n🌍 Lade ${lang.toUpperCase()}...`);
            await page.goto(url, { waitUntil: 'networkidle2' });

            // --- FUNKTION: Daten aus der Seite extrahieren ---
            // Wir holen jetzt komplexe Objekte zurück, nicht nur Strings
            const getPhaseData = async () => {
                return page.evaluate((containerSel, titleSel, itemCardSel) => {
                    const containers = document.querySelectorAll(containerSel);
                    const results = [];

                    containers.forEach(container => {
                        // A. Titel holen
                        const titleEl = container.querySelector(titleSel);
                        const title = titleEl ? titleEl.innerText.trim() : "Unknown Phase";

                        // B. Items holen (Array)
                        const items = [];
                        const cards = container.querySelectorAll(itemCardSel);

                        cards.forEach(card => {
                            // ID aus HREF holen (/items/metal_parts)
                            const link = card.querySelector('a');
                            const href = link ? link.getAttribute('href') : "";
                            const id = href.split('/').pop(); // Letzter Teil der URL ist die ID

                            // Name aus H3 holen
                            const nameEl = card.querySelector('h3');
                            const name = nameEl ? nameEl.innerText.trim() : "Unknown Item";

                            // Menge aus dem "0/150" Span holen
                            // Wir suchen nach einem Span, der einen Slash enthält
                            const spans = Array.from(card.querySelectorAll('span'));
                            const progressSpan = spans.find(s => s.innerText.includes('/'));
                            let amount = 0;
                            if (progressSpan) {
                                const parts = progressSpan.innerText.split('/');
                                if (parts.length > 1) {
                                    // "150" parsen aus "0/150"
                                    amount = parseInt(parts[1].trim());
                                }
                            }

                            if (id && amount > 0) {
                                items.push({ id, name, amount });
                            }
                        });

                        results.push({ title, items });
                    });
                    return results;
                }, PHASE_CONTAINER_SELECTOR, PHASE_TITLE_SELECTOR, ITEM_CARD_SELECTOR);
            };

            // --- 2. SEASON 2 LADEN (Index 0) ---
            await page.waitForSelector(DROPDOWN_TRIGGER);
            await page.click(DROPDOWN_TRIGGER);
            await page.waitForSelector(DROPDOWN_OPTION);

            // Klick auf Index 0
            await page.evaluate((sel) => { document.querySelectorAll(sel)[0].click(); }, DROPDOWN_OPTION);
            await new Promise(r => setTimeout(r, 1000)); // Warten auf Render

            const phasesS2 = await getPhaseData();
            console.log(`   👉 Season 2: ${phasesS2.length} Phasen analysiert.`);

            // Verteilen auf S2 und Flickering
            phasesS2.forEach((data, index) => {
                if (index < EXPEDITION_COUNT) {
                    if (!dataStore.season_2[index]) dataStore.season_2[index] = {};
                    dataStore.season_2[index][lang] = data; // Speichert Titel UND Items
                } else {
                    const fIndex = index - EXPEDITION_COUNT;
                    if (!dataStore.flickering[fIndex]) dataStore.flickering[fIndex] = {};
                    dataStore.flickering[fIndex][lang] = data;
                }
            });

            // --- 3. SEASON 1 LADEN (Index 1) ---
            await page.click(DROPDOWN_TRIGGER);
            await page.waitForSelector(DROPDOWN_OPTION);

            // Klick auf Index 1
            await page.evaluate((sel) => {
                const opts = document.querySelectorAll(sel);
                if (opts[1]) opts[1].click();
            }, DROPDOWN_OPTION);
            await new Promise(r => setTimeout(r, 1000));

            const phasesS1 = await getPhaseData();
            console.log(`   👉 Season 1: ${phasesS1.length} Phasen analysiert.`);

            phasesS1.forEach((data, index) => {
                if (index < EXPEDITION_COUNT) {
                    if (!dataStore.season_1[index]) dataStore.season_1[index] = {};
                    dataStore.season_1[index][lang] = data;
                }
            });

            await page.close();
        }

        // --- JSON ZUSAMMENBAUEN ---
        console.log("\n🔨 Baue JSON zusammen...");
        const outputList = [];

        // Helper Funktion
        const createEntry = (key, stageIndex, langData, config) => {
            // Wir nehmen die Item-Daten immer aus der ENGLISCHEN Version ('en'),
            // damit die Item-Namen in der JSON "Metal Parts" sind und nicht "Metallteile".
            // Die Titel werden übersetzt.

            const masterData = langData.en || Object.values(langData)[0]; // Fallback falls EN fehlt

            return {
                id: `${config.id_prefix}_stage_${parseInt(stageIndex) + 1}`,
                name: `${config.name_prefix.en}: ${masterData.title}`,
                trader: "Project",
                hasObtains: true,
                // HIER SIND JETZT DIE ITEMS:
                requiredItems: masterData.items.map(item => ({
                    id: item.id,
                    name: item.name, // Der englische Name von der Seite
                    amount: item.amount
                })),
                name_en: `${config.name_prefix.en}: ${langData.en?.title || ""}`,
                name_de: `${config.name_prefix.de}: ${langData.de?.title || ""}`,
                name_es: `${config.name_prefix.es}: ${langData.es?.title || ""}`,
                name_ru: `${config.name_prefix.ru}: ${langData.ru?.title || ""}`
            };
        };

        // 1. Season 2
        for (const idx in dataStore.season_2) {
            outputList.push(createEntry("s2", idx, dataStore.season_2[idx], PROJECT_CONFIG.season_2));
        }
        // 2. Season 1
        for (const idx in dataStore.season_1) {
            outputList.push(createEntry("s1", idx, dataStore.season_1[idx], PROJECT_CONFIG.season_1));
        }
        // 3. Flickering Flames
        for (const idx in dataStore.flickering) {
            outputList.push(createEntry("ff", idx, dataStore.flickering[idx], PROJECT_CONFIG.flickering));
        }

        fs.writeFileSync('project_list_complete.json', JSON.stringify(outputList, null, 2));
        console.log("💾 'project_list_complete.json' erfolgreich gespeichert!");

    } catch (e) {
        console.error("❌ Fehler:", e);
    } finally {
        await browser.close();
    }
}

scrapeProjectsWithItems();