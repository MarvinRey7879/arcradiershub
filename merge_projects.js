import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// DATEIEN
const LOOT_FILE = 'loot_data_v6.json';        // Deine aktuelle Loot-Datei
const PROJECT_FILE = 'project_list.json';     // Die neue Datei von oben
const OUTPUT_FILE = 'loot_data_final.json';   // Das Ergebnis

function mergeProjects() {
    console.log('🚀 Starte Merge von Projects in Loot Data...');

    const lootPath = path.join(__dirname, LOOT_FILE);
    const projectPath = path.join(__dirname, PROJECT_FILE);

    if (!fs.existsSync(lootPath) || !fs.existsSync(projectPath)) {
        console.error('❌ Eine der Dateien fehlt (loot_data_v6.json oder project_list.json).');
        return;
    }

    const lootData = require(lootPath);
    const projectList = require(projectPath);
    let updateCount = 0;

    // Wir gehen jedes Projekt durch
    projectList.forEach(project => {
        if (!project.requiredItems) return;

        project.requiredItems.forEach(req => {
            // Wir suchen das Item in der Loot-Liste
            // Wir suchen primär nach ID, falls vorhanden, sonst nach Name
            const lootItem = lootData.find(i =>
                (req.id && i.id === req.id) ||
                (i.name_en && i.name_en.toLowerCase() === req.name.toLowerCase())
            );

            if (lootItem) {
                // Initialisiere quests Array falls nicht vorhanden
                if (!lootItem.quests) lootItem.quests = [];

                // Prüfen ob der Eintrag schon existiert, um Duplikate zu vermeiden
                const exists = lootItem.quests.some(q => q.questId === project.id);

                if (!exists) {
                    lootItem.quests.push({
                        questId: project.id,
                        questName: project.name,
                        trader: project.trader,
                        amount: req.amount
                    });
                    // console.log(`   ➕ Added ${project.name} to ${lootItem.name_en}`);
                    updateCount++;
                }
            } else {
                console.warn(`⚠️  Item aus Projekt nicht in Loot-DB gefunden: ${req.name} (ID: ${req.id})`);
            }
        });
    });

    // Speichern
    fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), JSON.stringify(lootData, null, 2), 'utf-8');
    console.log('------------------------------------------------');
    console.log(`✅ Fertig! ${updateCount} Verknüpfungen hinzugefügt.`);
    console.log(`💾 Neue Datei gespeichert als: ${OUTPUT_FILE}`);
}

mergeProjects();