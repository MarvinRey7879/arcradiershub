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
// Wir suchen den Button genauer: Ein Button, der ein SVG mit Kreis enthält
const DONE_BUTTON_SELECTOR = 'button:has(svg.lucide-circle)';

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

async function scrapeAndSync() {
    console.log("🚀 Starte Quest-Übersetzer (mit Anti-Loop Fix)...");
    const browser = await puppeteer.launch({ headless: "new" });

    try {
        const pageEn = await setupPage(browser, 'en', URLS.en);
        const pageDe = await setupPage(browser, 'de', URLS.de);
        const pageEs = await setupPage(browser, 'es', URLS.es);

        let quests = [];
        try {
            quests = JSON.parse(fs.readFileSync(QUEST_LIST_FILE, 'utf8'));
        } catch (e) {
            console.error("❌ Konnte quest_list.json nicht lesen!", e);
            return;
        }

        console.log("\n🔄 Starte Synchronisation...");
        let matchCount = 0;
        let lastTitleEn = ""; // Um Endlosschleifen zu erkennen

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

            // Abbruch: Liste leer
            if (!titleEn || !titleDe || !titleEs) {
                console.log("🏁 Liste abgearbeitet (Keine Titel mehr gefunden).");
                break;
            }

            // ANTI-LOOP CHECK
            if (titleEn === lastTitleEn) {
                console.warn(`⚠️ ACHTUNG: Endlosschleife erkannt bei "${titleEn}". Der Klick hat nicht funktioniert! Breche ab.`);
                break;
            }
            lastTitleEn = titleEn;

            // B. JSON Update
            const searchKey = normalize(titleEn);
            const questEntry = quests.find(q => normalize(q.name) === searchKey);

            if (questEntry) {
                questEntry.name_en = titleEn;
                questEntry.name_de = titleDe;
                questEntry.name_es = titleEs;
                matchCount++;
                console.log(`   ✅ Match: "${titleEn}" -> DE: "${titleDe}"`);
            } else {
                console.warn(`   ⚠️ Kein JSON-Eintrag für: "${titleEn}"`);
            }

            // C. Klick & WARTE LOGIK
            const clickAndWait = async (page, currentTitle) => {
                // 1. Klicke den Button (via evaluate ist oft zuverlässiger)
                const clicked = await page.evaluate((btnSel) => {
                    const btn = document.querySelector(btnSel);
                    if (btn) {
                        btn.click();
                        return true;
                    }
                    return false;
                }, DONE_BUTTON_SELECTOR);

                if (!clicked) return;

                // 2. Warte aktiv, bis der Titel WEG ist oder sich ÄNDERT
                try {
                    await page.waitForFunction(
                        (sel, oldText) => {
                            const el = document.querySelector(sel);
                            // Wir sind fertig, wenn das Element weg ist ODER der Text anders ist
                            return !el || el.innerText.trim() !== oldText;
                        },
                        { timeout: 5000 }, // Max 5 Sekunden warten
                        QUEST_TITLE_SELECTOR,
                        currentTitle
                    );
                } catch (e) {
                    // Timeout ist okay, manchmal lädt es einfach lange
                }
            };

            await Promise.all([
                clickAndWait(pageEn, titleEn),
                clickAndWait(pageDe, titleDe),
                clickAndWait(pageEs, titleEs)
            ]);
        }

        // 3. Speichern
        console.log(`\n📊 Statistik: ${matchCount} von ${quests.length} Quests aktualisiert.`);
        fs.writeFileSync('quest_list_updated.json', JSON.stringify(quests, null, 2));
        console.log("💾 quest_list_updated.json erfolgreich gespeichert!");

    } catch (e) {
        console.error("❌ Fehler:", e);
    } finally {
        await browser.close();
    }
}

scrapeAndSync();