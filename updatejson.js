import fs from 'fs';

// 1. Daten laden (Stelle sicher, dass loot_data.json im gleichen Ordner liegt)
const rawData = fs.readFileSync('loot_data.json', 'utf8');
let data = JSON.parse(rawData);

// 2. Automatische Mappings aus den Item-Namen generieren
const deToEn = {};
const enToDe = {};

data.forEach(item => {
    if (item.name_de && item.name_en) {
        deToEn[item.name_de] = item.name_en;
        enToDe[item.name_en] = item.name_de;
    }
});

// 3. Manuelle Mappings für Schlüsselwörter und Abkürzungen
const manualDeToEn = {
    "Werkstatt": "Workshop",
    "Expedition": "Expedition",
    "Quest": "Quest",
    "Scrappy": "Scrappy",
    "Währung für Celeste": "Currency for Celeste",
    "Elektr. Komp.": "Electrical Components",
    "Mech. Komp.": "Mechanical Components",
    "Fortschr. elektr. Komp.": "Advanced Electrical Components",
    "Fortschr. mech. Komp.": "Advanced Mechanical Components",
    "Lautsprecherkomp.": "Speaker Component",
    "Synth. Treibstoff": "Synthesized Fuel",
    "Einfache Waffenteile": "Simple Gun Parts",
    "Verschiedene Samen": "Assorted Seeds",
    "Exodus Module": "Exodus Modules",
    "Power Rod": "Power Rod",
    "Magnetbeschleuniger": "Magnetic Accelerator",
    "Spannungswandler": "Voltage Converter",
    "Sensoren": "Sensors",
    "Batterie": "Battery",
    "Drähte": "Wires",
    "Magnet": "Magnet",
    "Kanister": "Canister",
    "Öl": "Oil",
    "Stahlfeder": "Steel Spring",
    "Robuster Stoff": "Durable Cloth",
    "Chemikalien": "Chemicals",
    "Stoff": "Fabric",
    "Metallteile": "Metal Parts",
    "Plastikteile": "Plastic Parts",
    "Gummiteile": "Rubber Parts",
    "ARC Legierung": "ARC Alloy",
    "Prozessor": "Processor",
    "Kühlkörper": "Heat Sink",
    "Leitsystem": "Guidance System",
    "Königinnen Reaktor": "Queen Reactor",
    "Matriarchin Reaktor": "Matriarch Reactor"
};

// Umkehrmapping für manuelles EN -> DE erstellen
const manualEnToDe = {};
Object.entries(manualDeToEn).forEach(([de, en]) => {
    manualEnToDe[en] = de;
});

// Zusatz für deutsche Keys im englischen Mapping
manualEnToDe["Workshop"] = "Werkstatt";
manualEnToDe["Expedition"] = "Expedition";
manualEnToDe["Quest"] = "Quest";
manualEnToDe["Currency for Celeste"] = "Währung für Celeste";

// 4. Übersetzungs-Hilfsfunktion
function translateName(name, targetLang) {
    const cleanName = name.trim();

    if (targetLang === 'en') {
        if (deToEn[cleanName]) return deToEn[cleanName];
        if (manualDeToEn[cleanName]) return manualDeToEn[cleanName];
        if (enToDe[cleanName]) return cleanName; // Ist schon englisch
        return cleanName;
    } else if (targetLang === 'de') {
        if (enToDe[cleanName]) return enToDe[cleanName];
        if (manualEnToDe[cleanName]) return manualEnToDe[cleanName];
        if (deToEn[cleanName]) return cleanName; // Ist schon deutsch
        return cleanName;
    }
    return cleanName;
}

// 5. Hauptlogik: Yield verarbeiten
data.forEach(item => {
    const yieldStr = item.yield;

    // Altes Feld entfernen (optional, falls gewünscht)
    delete item.yield;

    if (!yieldStr || yieldStr === '-' || yieldStr === null) {
        item.yield_en = null;
        item.yield_de = null;
        return;
    }

    const parts = yieldStr.split(',');
    const yieldEnParts = [];
    const yieldDeParts = [];

    parts.forEach(part => {
        part = part.trim();
        // Regex für "Anzahl x Name" (z.B. "5x Workshop")
        const match = part.match(/^(\d+x)\s+(.*)$/);

        if (match) {
            const qty = match[1];
            const name = match[2];
            yieldEnParts.push(`${qty} ${translateName(name, 'en')}`);
            yieldDeParts.push(`${qty} ${translateName(name, 'de')}`);
        } else {
            // Kein Mengenpräfix (z.B. "Currency for Celeste")
            yieldEnParts.push(translateName(part, 'en'));
            yieldDeParts.push(translateName(part, 'de'));
        }
    });

    item.yield_en = yieldEnParts.join(', ');
    item.yield_de = yieldDeParts.join(', ');
});

// 6. Neue Datei speichern
fs.writeFileSync('loot_data_updated.json', JSON.stringify(data, null, 2), 'utf8');

console.log("Fertig! Datei 'loot_data_updated.json' wurde erstellt.");