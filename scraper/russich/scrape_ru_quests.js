import puppeteer from 'puppeteer';
import fs from 'fs';

// --- KONFIGURATION ---
const QUEST_LIST_FILE = 'quest_list.json'; // Sollte bereits DE und ES enthalten, wenn du das willst

const URLS = {
    en: 'https://arctracker.io/quests',
    ru: 'https://arctracker.io/ru/quests'
};

const QUEST_TITLE_SELECTOR = 'h3.text-lg.font-semibold.text-primary > a';
const DONE_BUTTON_SELECTOR = 'button:has(svg.lucide-circle)';

function normalize(str) {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function setupPage(browser, lang, url) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    let langHeader = 'en-US';
    // Hier jetzt Russisch statt Deutsch/Spanisch
    if (lang === 'ru') langHeader = 'ru-RU';

    await page.setExtraHTTPHeaders({ 'Accept-Language': langHeader });

    console.log(`   🌍 Lade ${lang.toUpperCase()}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2' });

    return page;
}

async function scrapeAndSync() {
    console.log("🚀 Starte Quest-Übersetzer (EN + RU)...");
    const browser = await puppeteer.launch({ headless: "new" });

    try {
        // Nur noch Englisch und Russisch laden
        const pageEn = await setupPage(browser, 'en', URLS.en);
        const pageRu = await setupPage(browser, 'ru', URLS.ru);

        let quests = [];
        try {
            quests = JSON.parse(fs.readFileSync(QUEST_LIST_FILE, 'utf8'));
        } catch (e) {
            console.error("❌ Konnte quest_list.json nicht lesen!", e);
            return;
        }

        console.log("\n🔄 Starte Synchronisation...");
        let matchCount = 0;
        let lastTitleEn = "";

        while (true) {
            // A. Titel holen
            const getFirstTitle = async (page) => {
                return page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    return el ? el.innerText.trim() : null;
                }, QUEST_TITLE_SELECTOR);
            };

            // Wir holen nur EN und RU
            const [titleEn, titleRu] = await Promise.all([
                getFirstTitle(pageEn),
                getFirstTitle(pageRu)
            ]);

            // Abbruch: Wenn einer der beiden fehlt
            if (!titleEn || !titleRu) {
                console.log("🏁 Liste abgearbeitet (Keine Titel mehr gefunden).");
                break;
            }

            // ANTI-LOOP CHECK
            if (titleEn === lastTitleEn) {
                console.warn(`⚠️ ACHTUNG: Endlosschleife erkannt bei "${titleEn}". Breche ab.`);
                break;
            }
            lastTitleEn = titleEn;

            // B. JSON Update
            const searchKey = normalize(titleEn);
            const questEntry = quests.find(q => normalize(q.name) === searchKey);

            if (questEntry) {
                // Wir aktualisieren hier nur name_ru
                // name_de und name_es bleiben erhalten, wenn sie schon im JSON waren
                questEntry.name_ru = titleRu;

                matchCount++;
                console.log(`   ✅ Match: "${titleEn}" -> RU: "${titleRu}"`);
            } else {
                console.warn(`   ⚠️ Kein JSON-Eintrag für: "${titleEn}"`);
            }

            // C. Klick & WARTE LOGIK
            const clickAndWait = async (page, currentTitle) => {
                const clicked = await page.evaluate((btnSel) => {
                    const btn = document.querySelector(btnSel);
                    if (btn) {
                        btn.click();
                        return true;
                    }
                    return false;
                }, DONE_BUTTON_SELECTOR);

                if (!clicked) return;

                try {
                    await page.waitForFunction(
                        (sel, oldText) => {
                            const el = document.querySelector(sel);
                            return !el || el.innerText.trim() !== oldText;
                        },
                        { timeout: 5000 },
                        QUEST_TITLE_SELECTOR,
                        currentTitle
                    );
                } catch (e) {
                    // Timeout ignorieren
                }
            };

            // Klicken auf beiden Seiten (EN und RU)
            await Promise.all([
                clickAndWait(pageEn, titleEn),
                clickAndWait(pageRu, titleRu)
            ]);
        }

        // 3. Speichern
        console.log(`\n📊 Statistik: ${matchCount} von ${quests.length} Quests mit Russisch aktualisiert.`);
        // Ich speichere es als separate Datei, zur Sicherheit
        fs.writeFileSync('quest_list_updated_ru.json', JSON.stringify(quests, null, 2));
        console.log("💾 quest_list_updated_ru.json erfolgreich gespeichert!");

    } catch (e) {
        console.error("❌ Fehler:", e);
    } finally {
        await browser.close();
    }
}

scrapeAndSync();