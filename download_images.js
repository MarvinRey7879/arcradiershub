import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Setup für Importe
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Lade JSON (Pfad anpassen falls nötig)
const lootDataPath = path.join(__dirname, 'loot_data.json');
const lootData = require(lootDataPath);

// Download Ordner
const downloadFolder = path.join(__dirname, 'public', 'items');
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder, { recursive: true });
}

// Verbesserte Download Funktion
async function downloadImage(url, filename) {
    const filePath = path.join(downloadFolder, filename);
    const writer = fs.createWriteStream(filePath);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            // WICHTIG: Tarnung als echter Browser
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                // Prüfen ob Datei wirklich geschrieben wurde
                writer.close(() => {
                    const stats = fs.statSync(filePath);
                    if (stats.size > 0) {
                        resolve();
                    } else {
                        fs.unlinkSync(filePath); // Leere Datei löschen
                        reject(new Error("Datei war 0 Bytes groß"));
                    }
                });
            });
            writer.on('error', (err) => {
                fs.unlinkSync(filePath); // Kaputte Datei löschen
                reject(err);
            });
        });
    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw error;
    }
}

async function scrapeImages() {
    console.log(`Starte Download für ${lootData.length} Items...`);
    let successCount = 0;
    let errorCount = 0;

    for (const item of lootData) {
        const wikiPageUrl = `https://arcraiders.wiki/wiki/${item.name_en.replace(/ /g, '_')}`;

        try {
            // Seite laden
            const { data } = await axios.get(wikiPageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' } // Auch hier tarnen
            });
            const $ = cheerio.load(data);

            // Bild suchen
            let imageUrl = $('.infobox-image img').attr('src') ||
                $('.mw-parser-output img').first().attr('src');

            if (imageUrl) {
                if (imageUrl.startsWith('/')) {
                    imageUrl = `https://arcraiders.wiki${imageUrl}`;
                }

                // WICHTIG: Wir zwingen die Endung auf .webp, da dein Vue Code das erwartet.
                // Browser können PNGs mit .webp Endung trotzdem anzeigen (MIME Sniffing).
                const localFilename = `${item.id}.webp`;

                await downloadImage(imageUrl, localFilename);

                console.log(`✅ [${successCount + 1}] Gespeichert: ${item.name_en}`);
                successCount++;

            } else {
                console.warn(`⚠️  Kein Bild gefunden: ${item.name_en}`);
                errorCount++;
            }

        } catch (error) {
            console.error(`❌ Fehler bei ${item.name_en}: ${error.message}`);
            errorCount++;
        }

        // WICHTIG: Langsamere Pause (1 Sekunde), damit der Server nicht blockt
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('------------------------------------------------');
    console.log(`Fertig! Erfolgreich: ${successCount}, Fehler: ${errorCount}`);
}

scrapeImages();