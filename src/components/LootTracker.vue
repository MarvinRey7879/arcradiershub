<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
// Pfade ggf. anpassen, je nachdem wo deine JSONs liegen
import lootDataRaw from '../../loot_data_v6.json';
import questListRaw from '../../quest_list.json';

// --- State ---
const searchQuery = ref('');
const currentLang = ref('en');
const selectedRarities = ref([]);
const selectedActions = ref([]);
const itemsPerRow = ref(7);
const windowWidth = ref(1200);
const gridRef = ref(null);
const sortOrder = ref('name_asc');

// --- Quest State ---
const showQuestModal = ref(false);
const questSearchQuery = ref('');
const showOnlyLootQuests = ref(true);
const completedQuests = ref([]);

// --- TUTORIAL STATE ---
const showTutorial = ref(false);
const TEST_MODE_ALWAYS_SHOW_TUTORIAL = false; // Habe ich mal auf false gesetzt, damit es nicht nervt

// --- Konstanten ---
const rarityWeights = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5 };
const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const actions = [
    { value: 'keep', label: { de: 'Behalten (Keep)', en: 'Keep', fr: 'Guardar (Keep)' }, color: '#2ecc71' },
    { value: 'recycle', label: { de: 'Verwerten (Recycle)', en: 'Recycle', fr: 'Reciclar' }, color: '#e67e22' },
    { value: 'sell', label: { de: 'Verkaufen (Sell)', en: 'Sell', fr: 'Vender (Sell)' }, color: '#f1c40f' }
];

const langOptions = [
    { value: 'en', label: '🇺🇸 EN' },
    { value: 'de', label: '🇩🇪 DE' },
    { value: 'fr', label: '🇪🇸 ES' }
];

// --- Lifecycle ---
onMounted(() => {
    const navLang = navigator.language || navigator.userLanguage;
    if (navLang) {
        const lowerLang = navLang.toLowerCase();
        if (lowerLang.startsWith('de')) currentLang.value = 'de';
        else if (lowerLang.startsWith('es')) currentLang.value = 'fr';
        else currentLang.value = 'en';
    }

    nextTick(() => {
        updateDimensions();
        setInitialColumns();
        window.addEventListener('resize', updateDimensions);
    });

    const savedQuests = localStorage.getItem('arc_tracker_completed_quests');
    if (savedQuests) {
        try {
            completedQuests.value = JSON.parse(savedQuests);
        } catch (e) {
            console.error("Error loading quests", e);
        }
    }

    // Tutorial Logic
    const tutorialSeen = localStorage.getItem('arc_tracker_tutorial_seen');
    if (TEST_MODE_ALWAYS_SHOW_TUTORIAL || !tutorialSeen) {
        setTimeout(() => {
            showTutorial.value = true;
        }, 500);
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions);
});

watch(completedQuests, (newVal) => {
    localStorage.setItem('arc_tracker_completed_quests', JSON.stringify(newVal));
}, { deep: true });

const closeTutorial = () => {
    showTutorial.value = false;
    localStorage.setItem('arc_tracker_tutorial_seen', 'true');
};

// --- Layout Logic ---
const updateDimensions = () => { if (typeof window !== 'undefined') windowWidth.value = window.innerWidth; };
const setInitialColumns = () => {
    if (windowWidth.value < 768) itemsPerRow.value = 3;
    else if (windowWidth.value < 1200) itemsPerRow.value = 4;
    else itemsPerRow.value = 7;
};
const columnOptions = computed(() => {
    const opts = [];
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
    let maxColumns = windowWidth.value < 768 ? 5 : (windowWidth.value < 1200 ? 8 : 15);
    numbers.forEach(n => { if (n <= maxColumns) opts.push({ value: n, label: String(n) }); });
    return opts;
});
const gridStyle = computed(() => {
    return { 'grid-template-columns': `repeat(${itemsPerRow.value}, 1fr)` };
});

// --- Helper ---
const getName = (item) => item[`name_${currentLang.value}`] || item.name_en;
const getYield = (item) => item[`yield_${currentLang.value}`];
const getImageUrl = (id) => `/items/${id}.webp`;
const handleImageError = (e) => { e.target.src = 'https://placehold.co/200x200/1a1a1a/FFF?text=No+Image'; };
const getRarityClass = (rarity) => `rarity-${rarity.toLowerCase()}`;

// --- CORE LOGIC: Processed Items ---
// Hier passiert die Magie für deine Quest-Logik
const processedItems = computed(() => {
    return lootDataRaw.map(item => {
        // Prüfen, ob Quests offen sind (nicht in completedQuests enthalten)
        const activeQuests = item.quests ? item.quests.filter(q => !completedQuests.value.includes(q.questId)) : [];
        const hasActiveQuest = activeQuests.length > 0;

        // Standard: Nimm die Action aus der JSON (z.B. "recycle")
        let dynamicAction = item.action;

        // Wenn Quest aktiv -> Erzwinge "keep"
        if (hasActiveQuest) {
            dynamicAction = 'keep';
        }

        return {
            ...item,
            action: dynamicAction,       // Das wird angezeigt (Keep oder Original)
            originalAction: item.action, // Das Backup
            activeQuests: activeQuests,  // Liste der offenen Quests
            isQuestItem: hasActiveQuest  // Flag für die Anzeige der "For Quest"-Box
        };
    });
});

// --- Filtered Items ---
const filteredItems = computed(() => {
    let result = processedItems.value.filter(item => {
        const nameToSearch = getName(item);
        if (!nameToSearch) return false;

        const matchesSearch = nameToSearch.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesRarity = selectedRarities.value.length === 0 || selectedRarities.value.includes(item.rarity);

        // Filtert nach der DYNAMISCHEN Action (also Keep wenn Quest aktiv)
        const matchesAction = selectedActions.value.length === 0 || selectedActions.value.includes(item.action);

        return matchesSearch && matchesRarity && matchesAction;
    });

    return result.sort((a, b) => {
        switch (sortOrder.value) {
            case 'name_asc': return getName(a).localeCompare(getName(b));
            case 'name_desc': return getName(b).localeCompare(getName(a));
            case 'rarity_asc': return rarityWeights[a.rarity] - rarityWeights[b.rarity];
            case 'rarity_desc': return rarityWeights[b.rarity] - rarityWeights[a.rarity];
            case 'value_desc': return b.value - a.value;
            default: return 0;
        }
    });
});

// --- Quest Filter Logic ---
const filteredQuestList = computed(() => {
    return questListRaw.filter(quest => {
        const matchesSearch = quest.name.toLowerCase().includes(questSearchQuery.value.toLowerCase());
        const matchesType = showOnlyLootQuests.value ? quest.hasObtains : true;
        return matchesSearch && matchesType;
    });
});

const areAllVisibleSelected = computed(() => {
    if (filteredQuestList.value.length === 0) return false;
    return filteredQuestList.value.every(q => completedQuests.value.includes(q.id));
});

const toggleAllVisible = () => {
    const visibleIds = filteredQuestList.value.map(q => q.id);
    if (areAllVisibleSelected.value) {
        completedQuests.value = completedQuests.value.filter(id => !visibleIds.includes(id));
    } else {
        const newIds = visibleIds.filter(id => !completedQuests.value.includes(id));
        completedQuests.value = [...completedQuests.value, ...newIds];
    }
};

// --- Translation ---
const t = (key) => {
    const dict = {
        searchPlaceholder: { de: 'Suche Item Name...', en: 'Search item name...', fr: 'Buscar objeto...' },
        yieldLabel: { de: 'Verwertung:', en: 'Yield:', fr: 'Rendimiento:' },
        noResults: { de: 'Keine Items gefunden.', en: 'No items found.', fr: 'No se encontraron objetos.' },
        sortNameAZ: { de: 'Name (A-Z)', en: 'Name (A-Z)', fr: 'Nombre (A-Z)' },
        sortNameZA: { de: 'Name (Z-A)', en: 'Name (Z-A)', fr: 'Nombre (Z-A)' },
        sortRarityLowHigh: { de: 'Seltenheit (Niedrig → Hoch)', en: 'Rarity (Low → High)', fr: 'Rareza (Baja → Alta)' },
        sortRarityHighLow: { de: 'Seltenheit (Hoch → Niedrig)', en: 'Rarity (High → Low)', fr: 'Rareza (Alta → Baja)' },
        rarity: { de: 'Seltenheit', en: 'Rarity', fr: 'Rareza' },
        action: { de: 'Aktion', en: 'Action', fr: 'Acción' },
        colLabel: { de: 'Spalten', en: 'Cols', fr: 'Cols' },
        questLogBtn: { de: '📜 Quest Filter', en: '📜 Quest Filter', fr: '📜 Filtro de Misiones' },
        questModalTitle: { de: 'Quest Übersicht', en: 'Quest Overview', fr: 'Resumen de Misiones' },
        searchQuest: { de: 'Suche Quest...', en: 'Search quest...', fr: 'Buscar misión...' },
        onlyLootQuests: { de: 'Nur Loot-Relevante Quests', en: 'Only Loot Relevant Quests', fr: 'Solo misiones de botín' },
        close: { de: 'Schließen', en: 'Close', fr: 'Cerrar' },
        neededFor: { de: 'Für Quest:', en: 'For Quest:', fr: 'Para misión:' },
        selectAll: { de: 'Alle auswählen', en: 'Select All', fr: 'Seleccionar todo' },
        deselectAll: { de: 'Alle abwählen', en: 'Deselect All', fr: 'Deseleccionar todo' },
        tutTitle: { de: 'Neu: Quest Filter!', en: 'New: Quest Filter!', fr: 'Nuevo: Filtro de Misiones!' },
        tutDesc: {
            de: 'Markiere deine erledigten Quests. Items, die du nicht mehr brauchst, werden automatisch nicht mehr als "Keep" angezeigt.',
            en: 'Check off your completed quests. Items you no longer need will automatically stop showing as "Keep".',
            fr: 'Marca tus misiones completadas. Los objetos que ya no necesites dejarán de mostrarse automáticamente como "Keep".'
        },
        tutBtn: { de: 'Verstanden', en: 'Got it', fr: 'Entendido' }
    };
    return dict[key][currentLang.value] || dict[key]['en'];
};
</script>

<template>
    <div class="tracker-container">

        <div v-if="showTutorial" class="tutorial-backdrop" @click="closeTutorial"></div>

        <div class="controls" :class="{ 'tutorial-active': showTutorial }">
            <div class="top-row">
                <input type="text" v-model="searchQuery" :placeholder="t('searchPlaceholder')" class="search-bar" />

                <select v-model="sortOrder" class="control-select">
                    <option value="name_asc">{{ t('sortNameAZ') }}</option>
                    <option value="name_desc">{{ t('sortNameZA') }}</option>
                    <option value="rarity_asc">{{ t('sortRarityLowHigh') }}</option>
                    <option value="rarity_desc">{{ t('sortRarityHighLow') }}</option>
                </select>

                <select v-model="itemsPerRow" class="control-select columns-select">
                    <option v-for="opt in columnOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }} {{ t('colLabel') }}
                    </option>
                </select>

                <select v-model="currentLang" class="control-select lang-select">
                    <option v-for="opt in langOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>

                <div class="tutorial-wrapper">
                    <button @click="showQuestModal = true" class="quest-log-btn">
                        {{ t('questLogBtn') }}
                    </button>

                    <div v-if="showTutorial" class="tutorial-bubble">
                        <div class="arrow-up"></div>
                        <h4>{{ t('tutTitle') }}</h4>
                        <p>{{ t('tutDesc') }}</p>
                        <button class="tut-close-btn" @click.stop="closeTutorial">{{ t('tutBtn') }}</button>
                    </div>
                </div>
            </div>

            <div class="filter-row">
                <div class="filter-group">
                    <span class="filter-label">{{ t('rarity') }}:</span>
                    <div class="checkbox-wrapper">
                        <label v-for="rarity in rarities" :key="rarity" :class="getRarityClass(rarity)">
                            <input type="checkbox" :value="rarity" v-model="selectedRarities" />
                            {{ rarity }}
                        </label>
                    </div>
                </div>
                <div class="filter-group">
                    <span class="filter-label">{{ t('action') }}:</span>
                    <div class="checkbox-wrapper">
                        <label v-for="act in actions" :key="act.value" :style="{ color: act.color }">
                            <input type="checkbox" :value="act.value" v-model="selectedActions" />
                            {{ act.label[currentLang] }}
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showQuestModal" class="modal-backdrop" @click.self="showQuestModal = false">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>{{ t('questModalTitle') }}</h2>
                    <button class="close-btn" @click="showQuestModal = false">✕</button>
                </div>
                <div class="modal-controls">
                    <input type="text" v-model="questSearchQuery" :placeholder="t('searchQuest')"
                        class="modal-search" />
                    <button class="select-all-btn" @click="toggleAllVisible"
                        :class="{ 'active': areAllVisibleSelected }">
                        {{ areAllVisibleSelected ? t('deselectAll') : t('selectAll') }}
                    </button>
                    <label class="toggle-switch">
                        <input type="checkbox" v-model="showOnlyLootQuests" />
                        <span class="slider"></span>
                        <span class="toggle-label">{{ t('onlyLootQuests') }}</span>
                    </label>
                </div>
                <div class="quest-list">
                    <div v-for="quest in filteredQuestList" :key="quest.id" class="quest-item">
                        <label class="quest-checkbox-label">
                            <input type="checkbox" :value="quest.id" v-model="completedQuests" />
                            <span class="quest-info">
                                <span class="quest-name">{{ quest.name }}</span>
                                <span class="quest-trader">{{ quest.trader }}</span>
                            </span>
                        </label>
                        <div v-if="quest.hasObtains" class="quest-requirements">
                            <span v-for="req in quest.requiredItems" :key="req.id" class="req-badge">
                                {{ req.amount }}x {{ req.name }}
                            </span>
                        </div>
                    </div>
                    <div v-if="filteredQuestList.length === 0" class="no-quests">No quests found.</div>
                </div>
            </div>
        </div>

        <div class="grid" :style="gridStyle" ref="gridRef">
            <div v-for="item in filteredItems" :key="item.id" class="card" :class="getRarityClass(item.rarity)">
                <div class="action-badge" :class="item.action">
                    <span class="badge-text">{{ item.action.toUpperCase() }}</span>
                </div>
                <div class="image-wrapper">
                    <img :src="getImageUrl(item.id)" loading="lazy" decoding="async" @error="handleImageError"
                        alt="Item Image" />
                </div>
                <div class="card-content">
                    <h3 class="item-name">{{ getName(item) }}</h3>
                    <div class="info-row">
                        <span class="rarity-tag">{{ item.rarity }}</span>
                        <span class="value-tag">💰 {{ item.value }}</span>
                    </div>

                    <div v-if="item.isQuestItem && item.activeQuests.length > 0" class="quest-active-box">
                        <span class="quest-label">{{ t('neededFor') }}</span>
                        <ul class="quest-names">
                            <li v-for="q in item.activeQuests" :key="q.questId">
                                {{ q.amount }}x {{ q.questName }}
                            </li>
                        </ul>
                    </div>

                    <div v-if="item.action === 'recycle' && getYield(item)" class="yield-box">
                        <span class="label">{{ t('yieldLabel') }}</span>
                        <p class="yield-text">{{ getYield(item) }}</p>
                    </div>
                    <div v-else-if="!item.isQuestItem" class="yield-box simple">
                        <span v-if="item.action === 'keep'" class="action-text">✅ Keep</span>
                        <span v-if="item.action === 'sell'" class="action-text">💲 Sell</span>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="filteredItems.length === 0" class="empty-state">
            {{ t('noResults') }}
        </div>
    </div>
</template>

<style scoped>
/* --- VARIABLES --- */
.tracker-container {
    --bg-dark: #121212;
    --bg-card: #1e1e1e;
    --text-main: #ffffff;
    --text-muted: #b0b0b0;
    --common: #95a5a6;
    --uncommon: #2ecc71;
    --rare: #3498db;
    --epic: #9b59b6;
    --legendary: #f1c40f;
    --action-keep: #27ae60;
    --action-recycle: #e67e22;
    --action-sell: #f1c40f;
    --modal-bg: #252525;
}

.tracker-container {
    max-width: 100%;
    margin: 0;
    padding: 20px;
    color: var(--text-main);
    box-sizing: border-box;
}

/* --- CONTROLS --- */
.controls {
    background: var(--bg-card);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 30px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 5;
    /* Basis Z-Index */
}

/* WENN TUTORIAL AKTIV IST: Control Box über das Backdrop heben */
.controls.tutorial-active {
    z-index: 2001;
}

.top-row {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    /* Wichtig für Responsiveness */
    align-items: center;
}

.search-bar {
    flex: 1;
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid #333;
    background: #2a2a2a;
    color: white;
    font-size: 1.1rem;
    min-width: 200px;
}

.control-select {
    background: #2a2a2a;
    color: white;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 0 15px;
    cursor: pointer;
    font-size: 1rem;
    height: 45px;
}

.lang-select {
    font-weight: bold;
    min-width: 110px;
}

/* Quest Button Styles */
.quest-log-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 0 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1rem;
    height: 45px;
    transition: background 0.2s;
    white-space: nowrap;
}

.quest-log-btn:hover {
    background: #2980b9;
}

/* MEDIA QUERY FÜR MOBILE (wie in deinem Code) */
@media (max-width: 768px) {
    .top-row {
        flex-direction: column;
        align-items: stretch;
        /* Damit alles volle Breite hat */
    }

    .search-bar,
    .control-select,
    .tutorial-wrapper,
    /* Wrapper nimmt volle Breite */
    .quest-log-btn {
        /* Button nimmt volle Breite */
        width: 100%;
    }
}

/* --- FILTER STYLES (wie in deinem Code) --- */
.filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-label {
    font-size: 0.85rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.checkbox-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.checkbox-wrapper label {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9rem;
    font-weight: 500;
}

/* FARBEN (Wichtig: Klassennamen im HTML müssen matchen) */
.checkbox-wrapper label.rarity-common {
    color: var(--common);
}

.checkbox-wrapper label.rarity-uncommon {
    color: var(--uncommon);
}

.checkbox-wrapper label.rarity-rare {
    color: var(--rare);
}

.checkbox-wrapper label.rarity-epic {
    color: var(--epic);
}

.checkbox-wrapper label.rarity-legendary {
    color: var(--legendary);
}

/* --- TUTORIAL STYLES (Overlay) --- */
.tutorial-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    /* Blur ist da! */
    z-index: 2000;
    cursor: pointer;
    animation: fadeIn 0.3s ease-in-out;
}

.tutorial-wrapper {
    position: relative;
    /* Wrapper braucht keinen z-index mehr, da .controls angehoben wird */
}

.tutorial-bubble {
    position: absolute;
    top: 60px;
    /* Unter dem Button */
    right: 0;
    /* Rechtsbündig, damit es nicht rausragt */

    background: white;
    color: #121212;
    padding: 15px;
    border-radius: 8px;
    width: 260px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    animation: popIn 0.3s ease-out;
    text-align: left;
    z-index: 2002;
}

/* Pfeil zeigt auf Button */
.arrow-up {
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid white;
    position: absolute;
    top: -10px;
    right: 20px;
    /* Passend zum Button */
}

.tutorial-bubble h4 {
    margin: 0 0 8px 0;
    color: #3498db;
    font-weight: 800;
}

.tutorial-bubble p {
    margin: 0 0 12px 0;
    font-size: 0.9rem;
    line-height: 1.4;
    color: #333;
}

.tut-close-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 6px 15px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.85rem;
    float: right;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* --- MODAL STYLES --- */
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
    backdrop-filter: blur(5px);
}

.modal-content {
    background: var(--modal-bg);
    width: 90%;
    max-width: 600px;
    max-height: 85vh;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #444;
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1f1f1f;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.4rem;
}

.close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
}

.close-btn:hover {
    color: white;
}

.modal-controls {
    padding: 15px 20px;
    background: #2a2a2a;
    display: flex;
    gap: 15px;
    align-items: center;
    border-bottom: 1px solid #333;
    flex-wrap: wrap;
}

.modal-search {
    flex: 1;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #444;
    background: #1a1a1a;
    color: white;
}

.select-all-btn {
    background: #444;
    color: #ddd;
    border: 1px solid #555;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
    white-space: nowrap;
}

.select-all-btn:hover {
    background: #555;
    color: white;
}

.select-all-btn.active {
    background: #e74c3c;
    border-color: #c0392b;
    color: white;
}

.toggle-switch {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.9rem;
    user-select: none;
}

.toggle-switch input {
    display: none;
}

.slider {
    width: 40px;
    height: 20px;
    background: #555;
    border-radius: 20px;
    position: relative;
    transition: background 0.3s;
}

.slider::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
}

.toggle-switch input:checked+.slider {
    background: #3498db;
}

.toggle-switch input:checked+.slider::after {
    transform: translateX(20px);
}

.quest-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px 20px;
}

.quest-item {
    border-bottom: 1px solid #333;
    padding: 12px 0;
}

.quest-item:last-child {
    border-bottom: none;
}

.quest-checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
}

.quest-checkbox-label input[type="checkbox"] {
    margin-top: 4px;
    transform: scale(1.2);
    accent-color: #3498db;
}

.quest-info {
    display: flex;
    flex-direction: column;
}

.quest-name {
    font-weight: bold;
    font-size: 1rem;
    color: #eee;
}

.quest-trader {
    font-size: 0.8rem;
    color: #888;
}

.quest-requirements {
    margin-top: 8px;
    margin-left: 28px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.req-badge {
    background: rgba(52, 152, 219, 0.2);
    border: 1px solid rgba(52, 152, 219, 0.4);
    color: #aed6f1;
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 4px;
}

.quest-checkbox-label input:checked~.quest-info .quest-name {
    text-decoration: line-through;
    color: #666;
}

.no-quests {
    padding: 20px;
    text-align: center;
    color: #777;
}

/* --- GRID SYSTEM --- */
.grid {
    display: grid;
    /* CSS Grid Fallback - wird durch :style überschrieben */
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

/* --- CARD DESIGN & RESPONSIVE --- */
.card {
    container-type: inline-size;
    background: var(--bg-card);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    border: 1px solid #333;
    transition: transform 0.2s;
    display: flex;
    flex-direction: column;
}

.card:hover {
    transform: translateY(-3px);
}

.card.rarity-common {
    border-top: 3px solid var(--common);
}

.card.rarity-uncommon {
    border-top: 3px solid var(--uncommon);
}

.card.rarity-rare {
    border-top: 3px solid var(--rare);
}

.card.rarity-epic {
    border-top: 3px solid var(--epic);
}

.card.rarity-legendary {
    border-top: 3px solid var(--legendary);
}

.action-badge {
    position: absolute;
    top: 5px;
    right: 5px;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 900;
    color: #121212;
    z-index: 2;
}

.action-badge.keep {
    background: var(--action-keep);
    color: white;
}

.action-badge.recycle {
    background: var(--action-recycle);
    color: white;
}

.action-badge.sell {
    background: var(--action-sell);
    color: black;
}

.image-wrapper {
    width: 100%;
    aspect-ratio: 1 / 1;
    background: radial-gradient(circle, #2a2a2a 0%, #1a1a1a 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5px;
}

.image-wrapper img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
}

.card.rarity-common .image-wrapper {
    background: radial-gradient(circle, rgba(149, 165, 166, 0.2) 0%, rgba(30, 30, 30, 0) 70%);
}

.card.rarity-uncommon .image-wrapper {
    background: radial-gradient(circle, rgba(46, 204, 113, 0.25) 0%, rgba(30, 30, 30, 0) 70%);
}

.card.rarity-rare .image-wrapper {
    background: radial-gradient(circle, rgba(52, 152, 219, 0.3) 0%, rgba(30, 30, 30, 0) 70%);
}

.card.rarity-epic .image-wrapper {
    background: radial-gradient(circle, rgba(155, 89, 182, 0.35) 0%, rgba(30, 30, 30, 0) 70%);
}

.card.rarity-legendary .image-wrapper {
    background: radial-gradient(circle, rgba(241, 196, 15, 0.4) 0%, rgba(30, 30, 30, 0) 70%);
}

.card-content {
    padding: 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.item-name {
    margin: 0 0 5px 0;
    font-size: 1rem;
    line-height: 1.2;
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
}

.info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.8rem;
    color: var(--text-muted);
}

.yield-box {
    margin-top: auto;
    background: rgba(255, 255, 255, 0.05);
    padding: 6px;
    border-radius: 4px;
    font-size: 0.8rem;
}

.yield-box .label {
    display: block;
    font-size: 0.65rem;
    text-transform: uppercase;
    color: #666;
}

.yield-box p {
    margin: 0;
    color: #ddd;
    word-break: break-word;
}

.yield-box.simple {
    text-align: center;
    font-weight: bold;
}

.quest-active-box {
    margin-top: auto;
    background: rgba(46, 204, 113, 0.15);
    border: 1px solid rgba(46, 204, 113, 0.3);
    padding: 6px;
    border-radius: 4px;
    font-size: 0.8rem;
}

.quest-label {
    display: block;
    font-size: 0.65rem;
    text-transform: uppercase;
    color: #2ecc71;
    font-weight: bold;
    margin-bottom: 2px;
}

.quest-names {
    list-style: none;
    padding: 0;
    margin: 0;
    color: #a8e6cf;
}

.quest-names li {
    line-height: 1.2;
}

@container (max-width: 200px) {
    .card-content {
        padding: 6px;
    }

    .item-name {
        font-size: 0.85rem;
        margin-bottom: 3px;
    }

    .info-row {
        font-size: 0.7rem;
        flex-direction: column;
        gap: 2px;
    }

    .action-badge {
        font-size: 0.6rem;
        padding: 1px 4px;
    }

    .yield-box {
        font-size: 0.7rem;
    }
}

@container (max-width: 120px) {
    .item-name {
        font-size: 0.7rem;
        font-weight: normal;
    }

    .info-row {
        display: none;
    }

    .yield-box .label {
        display: none;
    }

    .yield-box {
        padding: 2px;
        background: transparent;
    }

    .action-text {
        font-size: 0.65rem;
    }

    .yield-text {
        font-size: 0.65rem;
        line-height: 1.1;
    }

    .image-wrapper {
        padding: 2px;
    }

    .action-badge {
        font-size: 0.5rem;
        top: 2px;
        right: 2px;
        opacity: 0.8;
    }
}
</style>