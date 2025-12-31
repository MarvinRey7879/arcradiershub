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
const OUTPUT_FILE = 'loot_data_final_fixed.json';
const BASE_URL = 'https://arctracker.io';
const LANGUAGES = ['en', 'de', 'es', 'ru'];

// --- URL GENERATOR ---
function generateUrlSlug(nameEn) {
    if (!nameEn) return '';
    return nameEn
        .toLowerCase()
        .replace(/[ -]/g, '_')
        .replace(/[^a-z0-9_]/g, '');
}

async function scrapeAndFixYields() {
    console.log("🚀 Starte Recycling-Yield Vergleich & Fixer...");
    console.log("   (Zeigt Änderungen von 'Alt' -> 'Neu' an)");

    let lootData = [];
    try {
        lootData = require(path.join(__dirname, INPUT_FILE));
    } catch (e) {
        console.error("❌ Konnte Input-Datei nicht lesen:", e);
        return;
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    let changeCount = 0;

    for (const [index, item] of lootData.entries()) {
        // Wir prüfen nur Items mit Action "recycle"
        if (item.action?.toLowerCase() !== 'recycle') {
            continue;
        }

        const urlSlug = generateUrlSlug(item.name_en);
        console.log(`\n📦 [${index + 1}/${lootData.length}] Prüfe: ${item.name_en}`);

        // Iteriere durch alle Sprachen
        for (const lang of LANGUAGES) {
            const langPrefix = lang === 'en' ? '' : `/${lang}`;
            const targetUrl = `${BASE_URL}${langPrefix}/items/${urlSlug}`;

            // Alten Wert speichern für den Vergleich
            const oldYield = item[`yield_${lang}`];

            try {
                const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
                if (response.status() === 404) {
                    process.stdout.write(`   ⚠️  ${lang.toUpperCase()}: 404 Nicht gefunden\n`);
                    continue;
                }

                // Daten extrahieren
                const data = await page.evaluate(() => {
                    const cardContent = document.querySelector('div[data-slot="card-content"]');
                    if (!cardContent) return null;

                    // Recycling Yield suchen (Icon: lucide-recycle)
                    const headers = Array.from(cardContent.querySelectorAll('h3'));
                    const recycleHeader = headers.find(h => h.querySelector('.lucide-recycle'));

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
                                const numberOnly = qRaw.replace(/[^0-9]/g, '');
                                const q = numberOnly ? `${numberOnly}x` : '';
                                return `${q} ${n}`.trim();
                            });
                            if (parts.length > 0) yieldString = parts.join(', ');
                        }
                    }
                    return yieldString;
                });

                // VERGLEICH: Alt vs Neu
                if (data) {
                    const newYield = data; // Das ist der String von der Website

                    if (oldYield !== newYield) {
                        console.log(`   ✏️  CHANGE [${lang.toUpperCase()}]`);
                        console.log(`      🔴 Alt: "${oldYield || '---'}"`);
                        console.log(`      🟢 Neu: "${newYield}"`);

                        // Wert aktualisieren
                        item[`yield_${lang}`] = newYield;
                        changeCount++;
                    } else {
                        // Kein Unterschied, nur kurze Bestätigung
                        process.stdout.write(`   ✅ ${lang.toUpperCase()} (identisch)\n`);
                    }
                } else {
                    process.stdout.write(`   ⚪ ${lang.toUpperCase()} (kein Recycle-Yield auf Website)\n`);
                }

            } catch (err) {
                console.log(`   ❌ Fehler bei ${lang.toUpperCase()}: ${err.message}`);
            }
        }
    }

    await browser.close();

    fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), JSON.stringify(lootData, null, 2));
    console.log(`\n🎉 FERTIG! Insgesamt ${changeCount} Werte aktualisiert.`);
    console.log(`💾 Gespeichert in: ${OUTPUT_FILE}`);
}

scrapeAndFixYields();