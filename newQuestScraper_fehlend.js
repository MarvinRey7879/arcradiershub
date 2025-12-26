import puppeteer from 'puppeteer';
import fs from 'fs';

// --- KONFIGURATION ---
const QUEST_LIST_FILE = 'quest_list.json';

const URLS = {
    en: 'https://arctracker.io/quests',
    de: 'https://arctracker.io/de/quests',
    es: 'https://arctracker.io/es/quests'
};

const QUEST_TITLE_SELECTOR = 'h3.text-lg.font-semibold.text-primary > a';
const DONE_BUTTON_SELECTOR = 'button:has(svg.lucide-circle)';

// Hilfsfunktion: Macht aus "Dormant Barons" -> "dormantbarons" (für IDs)
function normalize(str) {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function setupPage(browser, lang, url) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    let langHeader = 'en-US';
    if (lang === 'de') langHeader = 'de-DE';
    if (lang === 'es') langHeader = 'es-ES';

    await page.setExtraHTTPHeaders({ 'Accept-Language': langHeader });

    console.log(`   🌍 Lade ${lang.toUpperCase()}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2' });

    return page;
}

async function scrapeAndCreate() {
    console.log("🚀 Starte Auto-Creator Scraper...");
    const browser = await puppeteer.launch({ headless: "new" });

    try {
        const pageEn = await setupPage(browser, 'en', URLS.en);
        const pageDe = await setupPage(browser, 'de', URLS.de);
        const pageEs = await setupPage(browser, 'es', URLS.es);

        let quests = [];
        try {
            quests = JSON.parse(fs.readFileSync(QUEST_LIST_FILE, 'utf8'));
        } catch (e) {
            console.warn("⚠️ Keine quest_list.json gefunden, starte mit leerer Liste.");
            quests = [];
        }

        console.log("\n🔄 Starte Synchronisation & Erstellung...");
        let updatedCount = 0;
        let createdCount = 0;
        let lastTitleEn = "";

        while (true) {
            // A. Titel holen
            const getFirstTitle = async (page) => {
                return page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    return el ? el.innerText.trim() : null;
                }, QUEST_TITLE_SELECTOR);
            };

            const [titleEn, titleDe, titleEs] = await Promise.all([
                getFirstTitle(pageEn),
                getFirstTitle(pageDe),
                getFirstTitle(pageEs)
            ]);

            if (!titleEn || !titleDe || !titleEs) {
                console.log("🏁 Liste abgearbeitet.");
                break;
            }

            // Anti-Loop Schutz
            if (titleEn === lastTitleEn) {
                console.warn(`⚠️ Loop erkannt bei "${titleEn}". Breche ab.`);
                break;
            }
            lastTitleEn = titleEn;

            // B. Suchen oder Erstellen
            const searchKey = normalize(titleEn);
            let questEntry = quests.find(q => normalize(q.name) === searchKey);

            if (questEntry) {
                // UPDATE existierender Quest
                questEntry.name_en = titleEn;
                questEntry.name_de = titleDe;
                questEntry.name_es = titleEs;
                updatedCount++;
                console.log(`   ✏️ Update: "${titleEn}"`);
            } else {
                // NEU ERSTELLEN
                const newId = searchKey.replace(/\s+/g, '_'); // einfache ID Generierung

                const newQuest = {
                    id: newId,
                    name: titleEn,
                    trader: "Unknown", // Platzhalter, da wir den Trader hier nicht sehen
                    hasObtains: false,
                    requiredItems: [], // Leer, wie gewünscht
                    name_en: titleEn,
                    name_de: titleDe,
                    name_es: titleEs
                };

                quests.push(newQuest);
                createdCount++;
                console.log(`   ✨ NEU ERSTELLT: "${titleEn}" -> DE: "${titleDe}"`);
            }

            // C. Klicken & Warten
            const clickAndWait = async (page, currentTitle) => {
                const clicked = await page.evaluate((btnSel) => {
                    const btn = document.querySelector(btnSel);
                    if (btn) { btn.click(); return true; }
                    return false;
                }, DONE_BUTTON_SELECTOR);

                if (!clicked) return;

                try {
                    await page.waitForFunction(
                        (sel, oldText) => {
                            const el = document.querySelector(sel);
                            return !el || el.innerText.trim() !== oldText;
                        },
                        { timeout: 4000 },
                        QUEST_TITLE_SELECTOR,
                        currentTitle
                    );
                } catch (e) { }
            };

            await Promise.all([
                clickAndWait(pageEn, titleEn),
                clickAndWait(pageDe, titleDe),
                clickAndWait(pageEs, titleEs)
            ]);
        }

        // Speichern
        console.log(`\n📊 Statistik:`);
        console.log(`   ✏️ Aktualisiert: ${updatedCount}`);
        console.log(`   ✨ Neu erstellt: ${createdCount}`);
        console.log(`   Gesamt: ${quests.length}`);

        fs.writeFileSync('quest_list_updated.json', JSON.stringify(quests, null, 2));
        console.log("💾 quest_list_updated.json erfolgreich gespeichert!");

    } catch (e) {
        console.error("❌ Fehler:", e);
    } finally {
        await browser.close();
    }
}

scrapeAndCreate();