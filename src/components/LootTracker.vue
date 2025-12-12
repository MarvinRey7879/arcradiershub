<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import lootData from '../../loot_data.json';

// --- State ---
const searchQuery = ref('');
const currentLang = ref('de');
const selectedRarities = ref([]);
const selectedActions = ref([]);
const itemsPerRow = ref('auto');

// Für Responsive Logic
const windowWidth = ref(1200);
const gridRef = ref(null); // NEU: Referenz auf das Grid-HTML-Element
const calculatedAutoCols = ref(1); // NEU: Speichert die aktuelle Auto-Spaltenzahl

const rarityWeights = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5 };
const sortOrder = ref('name_asc');

const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const actions = [
    { value: 'keep', label: 'Behalten (Keep)', color: '#2ecc71' },
    { value: 'recycle', label: 'Verwerten (Recycle)', color: '#e67e22' },
    { value: 'sell', label: 'Verkaufen (Sell)', color: '#f1c40f' }
];

// --- Window Resize & Auto-Column Calculation ---
const updateDimensions = () => {
    if (typeof window !== 'undefined') {
        windowWidth.value = window.innerWidth;

        // NEU: Berechnen, wie viele Spalten bei "Auto" reinpassen
        if (gridRef.value) {
            const containerWidth = gridRef.value.offsetWidth;
            const minCardWidth = 250; // Muss mit CSS minmax(250px...) übereinstimmen
            const gap = 15; // Muss mit CSS gap: 15px übereinstimmen

            // Formel: Wie oft passt (Karte + Gap) in die Breite?
            // Wir addieren einmal Gap zur Breite, um die Rechnung zu vereinfachen 
            // (da es n Karten und n-1 Gaps sind)
            const cols = Math.floor((containerWidth + gap) / (minCardWidth + gap));
            calculatedAutoCols.value = Math.max(1, cols);
        }
    }
};

onMounted(() => {
    // nextTick sorgt dafür, dass das HTML fertig gerendert ist, bevor wir messen
    nextTick(() => {
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
    });
});

onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions);
});

// --- Computed: Dynamische Spalten-Optionen ---
const columnOptions = computed(() => {
    // Label für Auto generieren: "Auto (3)"
    const autoLabelText = `Auto (${calculatedAutoCols.value})`;

    const opts = [{ value: 'auto', label: autoLabelText }];
    let numbers = [];

    if (windowWidth.value < 768) {
        numbers = [1, 2, 3, 4, 5];
    } else if (windowWidth.value < 1200) {
        numbers = [2, 3, 4, 5, 6];
    } else {
        numbers = [3, 4, 5, 6, 7, 8, 9, 12, 15];
    }

    numbers.forEach(n => {

        opts.push({ value: n, label: String(n) });
    });

    return opts;
});

// --- Computed: Filter & Sortierung ---
const filteredItems = computed(() => {
    let result = lootData.filter(item => {
        const nameToSearch = currentLang.value === 'de' ? item.name_de : item.name_en;
        if (!nameToSearch) return false;
        const matchesSearch = nameToSearch.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesRarity = selectedRarities.value.length === 0 || selectedRarities.value.includes(item.rarity);
        const matchesAction = selectedActions.value.length === 0 || selectedActions.value.includes(item.action);
        return matchesSearch && matchesRarity && matchesAction;
    });

    return result.sort((a, b) => {
        const getName = (obj) => currentLang.value === 'de' ? obj.name_de : obj.name_en;
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

const gridStyle = computed(() => {
    if (itemsPerRow.value === 'auto') {
        return {};
    }
    return { 'grid-template-columns': `repeat(${itemsPerRow.value}, 1fr)` };
});

// --- Helper Methoden ---
const toggleLang = () => { currentLang.value = currentLang.value === 'de' ? 'en' : 'de'; };
const getImageUrl = (id) => { return `/items/${id}.webp`; };
const handleImageError = (e) => { e.target.src = 'https://placehold.co/200x200/1a1a1a/FFF?text=No+Image'; };
const getRarityClass = (rarity) => { return `rarity-${rarity.toLowerCase()}`; };

const t = (key) => {
    const dict = {
        searchPlaceholder: { de: 'Suche Item Name...', en: 'Search item name...' },
        yieldLabel: { de: 'Verwertung:', en: 'Yield:' },
        noResults: { de: 'Keine Items gefunden.', en: 'No items found.' },
        sortNameAZ: { de: 'Name (A-Z)', en: 'Name (A-Z)' },
        sortNameZA: { de: 'Name (Z-A)', en: 'Name (Z-A)' },
        sortRarityLowHigh: { de: 'Seltenheit (Niedrig → Hoch)', en: 'Rarity (Low → High)' },
        sortRarityHighLow: { de: 'Seltenheit (Hoch → Niedrig)', en: 'Rarity (High → Low)' },
        rarity: { de: 'Seltenheit', en: 'Rarity' },
        action: { de: 'Aktion', en: 'Action' }
    };
    if (!dict[key]) return key;
    return dict[key][currentLang.value];
};
</script>

<template>
    <div class="tracker-container">
        <div class="controls">
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
                        {{ opt.label }}
                        {{ opt.value !== 'auto' ? (currentLang === 'de' ? 'Spalten' : 'Cols') : '' }}
                    </option>
                </select>

                <button @click="toggleLang" class="lang-btn">
                    {{ currentLang === 'de' ? '🇺🇸 EN' : '🇩🇪 DE' }}
                </button>
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
                            {{ currentLang === 'de' ? act.label.split('(')[0] : act.label.split('(')[1].replace(')', '')
                            }}
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid" :style="gridStyle" ref="gridRef">
            <div v-for="item in filteredItems" :key="item.id" class="card" :class="getRarityClass(item.rarity)">
                <div class="action-badge" :class="item.action">
                    <span class="badge-text">{{ item.action.toUpperCase() }}</span>
                </div>

                <div class="image-wrapper">
                    <img :src="getImageUrl(item.id)" @error="handleImageError" alt="Item Image" />
                </div>

                <div class="card-content">
                    <h3 class="item-name">
                        {{ currentLang === 'de' ? item.name_de : item.name_en }}
                    </h3>

                    <div class="info-row">
                        <span class="rarity-tag">{{ item.rarity }}</span>
                        <span class="value-tag">💰 {{ item.value }}</span>
                    </div>

                    <div v-if="item.action === 'recycle' && item.yield" class="yield-box">
                        <span class="label">{{ t('yieldLabel') }}</span>
                        <p class="yield-text">{{ item.yield }}</p>
                    </div>

                    <div v-else class="yield-box simple">
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
}

.top-row {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.search-bar {
    flex: 1;
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid #333;
    background: #2a2a2a;
    color: white;
    font-size: 1.1rem;
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

.lang-btn {
    background: #333;
    color: white;
    border: 1px solid #444;
    padding: 0 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    height: 45px;
}

@media (max-width: 768px) {
    .top-row {
        flex-direction: column;
    }

    .search-bar,
    .control-select,
    .lang-btn {
        width: 100%;
    }
}

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

/* --- GRID SYSTEM --- */
.grid {
    display: grid;
    /* CSS Grid mit minmax 250px + gap */
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