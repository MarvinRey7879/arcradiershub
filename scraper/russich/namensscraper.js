import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// --- KONFIGURATION ---
const INPUT_FILE = 'loot_data_final.json';
const OUTPUT_FILE = 'loot_data_final_ru.json';
const BASE_URL_RU = 'https://arctracker.io/ru/items/';

// --- URL GENERATOR (NEU: Bindestriche werden auch zu Unterstrichen) ---
function generateUrlSlug(nameEn) {
    if (!nameEn) return '';
    return nameEn
        .toLowerCase()
        // Ersetze Leerzeichen ODER Bindestriche durch Unterstriche
        .replace(/[ -]/g, '_')
        // Entferne alle anderen Sonderzeichen (außer a-z, 0-9 und _)
        .replace(/[^a-z0-9_]/g, '');
}

async function scrapeRuItems() {
    console.log("🚀 Starte RU Item Scraper (Final V2)...");

    const lootData = require(path.join(__dirname, INPUT_FILE));

    // Browser starten
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Viewport groß genug setzen
    await page.setViewport({ width: 1280, height: 800 });

    let successCount = 0;
    let errorCount = 0;

    for (const [index, item] of lootData.entries()) {
        // Generiere URL aus dem englischen Namen
        const urlSlug = generateUrlSlug(item.name_en);
        const targetUrl = `${BASE_URL_RU}${urlSlug}`;

        process.stdout.write(`[${index + 1}/${lootData.length}] ${urlSlug}... `);

        try {
            // Seite laden (max 10s warten)
            const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

            if (response.status() === 404) {
                console.log("❌ 404");
                errorCount++;
                continue;
            }

            // Warten bis Content da ist
            try {
                await page.waitForSelector('div[data-slot="card-content"] h2', { timeout: 3000 });
            } catch (e) {
                console.log("⚠️ Timeout (Leer)");
                errorCount++;
                continue;
            }

            // --- DATEN IM BROWSER EXTRAHIEREN ---
            const data = await page.evaluate(() => {
                const cardContent = document.querySelector('div[data-slot="card-content"]');
                if (!cardContent) return { name: null, yieldString: null };

                // 1. NAME (Russisch)
                const nameEl = cardContent.querySelector('h2.text-3xl.font-bold');
                const name = nameEl ? nameEl.innerText.trim() : null;

                // 2. YIELD (Recycling) - Sauber formatiert
                const headers = Array.from(cardContent.querySelectorAll('h3'));
                const recycleHeader = headers.find(h =>
                    h.innerText.includes('Перерабатывается в') ||
                    h.querySelector('.lucide-recycle')
                );

                let yieldString = null;

                if (recycleHeader) {
                    const parentContainer = recycleHeader.parentElement;
                    const gridDiv = parentContainer.querySelector('.grid');

                    if (gridDiv) {
                        const itemLinks = Array.from(gridDiv.querySelectorAll('a'));

                        const parts = itemLinks.map(link => {
                            const nameP = link.querySelector('p.text-xs.font-medium');
                            const qtyP = link.querySelector('p.text-xs.text-muted-foreground');

                            const n = nameP ? nameP.innerText.trim() : '';
                            const qRaw = qtyP ? qtyP.innerText.trim() : '';

                            // BEREINIGUNG: Nur Zahlen behalten (z.B. aus "x14" wird "14")
                            const numberOnly = qRaw.replace(/[^0-9]/g, '');

                            // Formatierung: "14" -> "14x"
                            const q = numberOnly ? `${numberOnly}x` : '';

                            return `${q} ${n}`.trim();
                        });

                        if (parts.length > 0) {
                            yieldString = parts.join(', ');
                        }
                    }
                }

                return { name, yieldString };
            });

            // Speichern in das Item-Objekt
            if (data.name) {
                item.name_ru = data.name;
                item.yield_ru = data.yieldString || null;
                console.log(`✅ "${data.name}" | Yield: ${data.yieldString || '---'}`);
                successCount++;
            } else {
                console.log("⚠️ Name nicht gefunden");
                errorCount++;
            }

        } catch (err) {
            console.log(`❌ Err: ${err.message}`);
            errorCount++;
        }

        // Kurze Pause (200ms)
        await new Promise(r => setTimeout(r, 200));
    }

    await browser.close();

    // Datei schreiben
    fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), JSON.stringify(lootData, null, 2));
    console.log(`\n🎉 FERTIG! ${successCount} Items aktualisiert.`);
    console.log(`💾 Gespeichert in: ${OUTPUT_FILE}`);
}

scrapeRuItems();