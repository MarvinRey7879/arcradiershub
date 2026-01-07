<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// Pfade anpassen falls nötig!
import lootDataRaw from '../../loot_data_final.json';
import questListRaw from '../../quest_list_final.json';
import projectListRaw from '../../project_list_final.json';
// Importiert die Datei aus dem Scraper
import hideoutListRaw from '../../hideout_data_final.json';

const emit = defineEmits(['lang-change']);

const { t, locale } = useI18n();



// --- State ---
const searchQuery = ref('');
const currentLang = computed({
    get: () => locale.value,
    set: (val) => {
        locale.value = val;
        emit('lang-change', val);
    }
});

const selectedRarities = ref([]);
const selectedActions = ref([]);
const itemsPerRow = ref(7);
const windowWidth = ref(1200);
const gridRef = ref(null);
const sortOrder = ref('name_asc');

// --- Quest, Project & Hideout State ---
const showQuestModal = ref(false);
const showProjectModal = ref(false);
const showHideoutModal = ref(false);

const questSearchQuery = ref('');
const projectSearchQuery = ref('');
const hideoutSearchQuery = ref('');

const showOnlyLootQuests = ref(true);

const completedQuests = ref([]);
const completedProjects = ref([]);
// Hier speichern wir jetzt Strings wie "sprengstoffstation_1", "sprengstoffstation_2"
const completedHideoutLevels = ref([]);

// --- TUTORIAL STATE ---
const tutorialStep = ref(0);

// --- Mapping & Konstanten ---
const rarityWeights = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5 };
const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const langOptions = [
    { value: 'en', label: '🇺🇸 EN' },
    { value: 'de', label: '🇩🇪 DE' },
    { value: 'es', label: '🇪🇸 ES' },
    { value: 'ru', label: '🇷🇺 RU' }
];

const actions = [
    { value: 'keep', i18nKey: 'tracker.actions.keep', color: '#2ecc71' },
    { value: 'recycle', i18nKey: 'tracker.actions.recycle', color: '#e67e22' },
    { value: 'sell', i18nKey: 'tracker.actions.sell', color: '#f1c40f' }
];

// --- DATA HELPERS ---

const itemMap = computed(() => {
    const map = {};
    lootDataRaw.forEach(item => { map[item.id] = item; });
    return map;
});

const objectivesMap = computed(() => {
    const map = {};
    questListRaw.forEach(q => { map[q.id] = { ...q, type: 'quest' }; });
    projectListRaw.forEach(p => { map[p.id] = { ...p, type: 'project' }; });
    return map;
});

const getLocName = (obj) => {
    if (!obj) return 'Unknown';
    const lang = currentLang.value;

    if (lang === 'es') {
        if (obj.name_es) return obj.name_es;
        if (obj.name_fr) return obj.name_fr;
        return obj.name_en || obj.name;
    }
    return obj[`name_${lang}`] || obj.name_en || obj.name;
};

const getLocYield = (item) => {
    const lang = currentLang.value;
    if (lang === 'es') return item.yield_fr || item.yield_en;
    return item[`yield_${lang}`] || item.yield_en;
};

const resolveItemName = (itemId, fallbackName) => {
    const item = itemMap.value[itemId];
    if (item) return getLocName(item);
    return fallbackName;
};

// --- Lifecycle ---
onMounted(() => {
    nextTick(() => {
        updateDimensions();
        setInitialColumns();
        window.addEventListener('resize', updateDimensions);
    });

    const savedQuests = localStorage.getItem('arc_tracker_completed_quests');
    if (savedQuests) { try { completedQuests.value = JSON.parse(savedQuests); } catch (e) { } }

    const savedProjects = localStorage.getItem('arc_tracker_completed_projects');
    if (savedProjects) { try { completedProjects.value = JSON.parse(savedProjects); } catch (e) { } }

    const savedHideout = localStorage.getItem('arc_tracker_completed_hideout_levels');
    if (savedHideout) { try { completedHideoutLevels.value = JSON.parse(savedHideout); } catch (e) { } }

    const tutorialSeen = localStorage.getItem('arc_tracker_tutorial_seen');
    if (!tutorialSeen) {
        setTimeout(() => { tutorialStep.value = 1; }, 800);
    }
});

onUnmounted(() => {
    if (typeof window !== 'undefined') window.removeEventListener('resize', updateDimensions);
});

// Watchers
watch(completedQuests, (newVal) => localStorage.setItem('arc_tracker_completed_quests', JSON.stringify(newVal)), { deep: true });
watch(completedProjects, (newVal) => localStorage.setItem('arc_tracker_completed_projects', JSON.stringify(newVal)), { deep: true });
// Speichern der Levels
watch(completedHideoutLevels, (newVal) => localStorage.setItem('arc_tracker_completed_hideout_levels', JSON.stringify(newVal)), { deep: true });


// --- Tutorial Actions ---
const nextTutorialStep = () => { tutorialStep.value = 2; };
const finishTutorial = () => {
    tutorialStep.value = 0;
    localStorage.setItem('arc_tracker_tutorial_seen', 'true');
};
const skipTutorial = () => { finishTutorial(); };

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
const gridStyle = computed(() => ({ 'grid-template-columns': `repeat(${itemsPerRow.value}, 1fr)` }));


// --- HIDEOUT LOGIC: Reverse Mapping ---
// Wir erstellen eine Map: ItemID -> Liste der benötigten Hideout-Levels (die noch nicht fertig sind)
const hideoutRequirementsMap = computed(() => {
    const map = {};
    const completedSet = new Set(completedHideoutLevels.value);

    hideoutListRaw.forEach(station => {
        if (!station.levels) return;

        station.levels.forEach(lvl => {
            // ID muss exakt so gebaut sein wie im Modal (stationId_Level)
            const uniqueId = `${station.id}_${lvl.level}`;

            // Wenn dieses Level erledigt ist -> Items NICHT mehr als benötigt markieren
            if (completedSet.has(uniqueId)) return;

            lvl.requiredItems.forEach(req => {
                // req.id ist z.B. "rubber_parts"
                if (!map[req.id]) map[req.id] = [];

                map[req.id].push({
                    questId: uniqueId,
                    amount: req.amount,
                    // Name z.B.: "Sprengstoffstation (Lvl 1)"
                    questName: `${getLocName(station)} (Lvl ${lvl.level})`,
                    trader: t('tracker.hideout'), // Zeigt "Unterschlupf" / "Hideout"
                    type: 'hideout'
                });
            });
        });
    });
    return map;
});


// --- CORE LOGIC: Processed Items ---
const processedItems = computed(() => {
    const allCompletedIds = new Set([...completedQuests.value, ...completedProjects.value]);

    // Hier holen wir uns die berechneten Hideout-Daten
    const hideoutMap = hideoutRequirementsMap.value;

    return lootDataRaw.map(item => {
        const activeRequirements = [];

        // 1. Quests & Projekte (stehen direkt im Item in der JSON)
        const rawQuests = item.quests || [];
        rawQuests.forEach(qRef => {
            const idToCheck = (qRef.questId || qRef.id).trim();

            if (allCompletedIds.has(idToCheck)) return;

            const objectiveData = objectivesMap.value[idToCheck];
            if (objectiveData) {
                activeRequirements.push({
                    questId: idToCheck,
                    amount: qRef.amount,
                    questName: getLocName(objectiveData),
                    trader: objectiveData.trader,
                    type: objectiveData.type
                });
            } else {
                // Fallback für alte Daten
                activeRequirements.push({
                    questId: idToCheck,
                    amount: qRef.amount,
                    questName: qRef.questName || 'Unknown',
                    trader: '?',
                    type: 'unknown'
                });
            }
        });

        // 2. NEU: Hideout Requirements hinzufügen
        // Wir schauen in unserer Map nach, ob DIESES Item (item.id) für Hideout gebraucht wird
        if (hideoutMap[item.id]) {
            // Wenn ja, fügen wir alle Einträge hinzu
            activeRequirements.push(...hideoutMap[item.id]);
        }

        const hasActiveReq = activeRequirements.length > 0;

        // Status berechnen (Keep/Sell)
        let dynamicAction = item.action;
        if (hasActiveReq) {
            dynamicAction = 'keep';
        }

        return {
            ...item,
            action: dynamicAction,
            originalAction: item.action,
            activeQuests: activeRequirements,
            isQuestItem: hasActiveReq,
            _locName: getLocName(item)
        };
    });
});
// --- Filtered Items ---
const filteredItems = computed(() => {
    let result = processedItems.value.filter(item => {
        const nameToSearch = item._locName;
        if (!nameToSearch) return false;

        const matchesSearch = nameToSearch.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesRarity = selectedRarities.value.length === 0 || selectedRarities.value.includes(item.rarity);
        const matchesAction = selectedActions.value.length === 0 || selectedActions.value.includes(item.action);

        return matchesSearch && matchesRarity && matchesAction;
    });

    return result.sort((a, b) => {
        switch (sortOrder.value) {
            case 'name_asc': return a._locName.localeCompare(b._locName);
            case 'name_desc': return b._locName.localeCompare(a._locName);
            case 'rarity_asc': return rarityWeights[a.rarity] - rarityWeights[b.rarity];
            case 'rarity_desc': return rarityWeights[b.rarity] - rarityWeights[a.rarity];
            case 'value_desc': return b.value - a.value;
            default: return 0;
        }
    });
});

// --- Modals Logic ---
const getFilteredList = (sourceList, query, onlyObtains = false) => {
    return sourceList.filter(entry => {
        const name = getLocName(entry);
        const matchesSearch = name.toLowerCase().includes(query.toLowerCase());
        const matchesType = onlyObtains ? entry.hasObtains : true;
        return matchesSearch && matchesType;
    });
};

const filteredQuestList = computed(() => getFilteredList(questListRaw, questSearchQuery.value, showOnlyLootQuests.value));
const filteredProjectList = computed(() => getFilteredList(projectListRaw, projectSearchQuery.value, false));
// Hideout wird hier direkt genutzt, Filterung erfolgt im Template oder hier
const filteredHideoutList = computed(() => getFilteredList(hideoutListRaw, hideoutSearchQuery.value, false));

// Toggle Logic Quest/Project (unverändert) ...
const areAllQuestsVisibleSelected = computed(() => {
    if (filteredQuestList.value.length === 0) return false;
    return filteredQuestList.value.every(q => completedQuests.value.includes(q.id));
});
const toggleAllQuestsVisible = () => {
    const visibleIds = filteredQuestList.value.map(q => q.id);
    if (areAllQuestsVisibleSelected.value) {
        completedQuests.value = completedQuests.value.filter(id => !visibleIds.includes(id));
    } else {
        const newIds = visibleIds.filter(id => !completedQuests.value.includes(id));
        completedQuests.value = [...completedQuests.value, ...newIds];
    }
};

const areAllProjectsVisibleSelected = computed(() => {
    if (filteredProjectList.value.length === 0) return false;
    return filteredProjectList.value.every(p => completedProjects.value.includes(p.id));
});
const toggleAllProjectsVisible = () => {
    const visibleIds = filteredProjectList.value.map(p => p.id);
    if (areAllProjectsVisibleSelected.value) {
        completedProjects.value = completedProjects.value.filter(id => !visibleIds.includes(id));
    } else {
        const newIds = visibleIds.filter(id => !completedProjects.value.includes(id));
        completedProjects.value = [...completedProjects.value, ...newIds];
    }
};

// --- Toggle Logic Hideout (alle Levels aller sichtbaren Stationen) ---
const getAllVisibleHideoutIds = computed(() => {
    const ids = [];
    filteredHideoutList.value.forEach(station => {
        if (station.levels) {
            station.levels.forEach(lvl => {
                ids.push(`${station.id}_${lvl.level}`);
            });
        }
    });
    return ids;
});

const areAllHideoutVisibleSelected = computed(() => {
    const visible = getAllVisibleHideoutIds.value;
    if (visible.length === 0) return false;
    return visible.every(id => completedHideoutLevels.value.includes(id));
});

const toggleAllHideoutVisible = () => {
    const visibleIds = getAllVisibleHideoutIds.value;
    if (areAllHideoutVisibleSelected.value) {
        completedHideoutLevels.value = completedHideoutLevels.value.filter(id => !visibleIds.includes(id));
    } else {
        // Nur die hinzufügen, die noch fehlen
        const newIds = visibleIds.filter(id => !completedHideoutLevels.value.includes(id));
        completedHideoutLevels.value = [...completedHideoutLevels.value, ...newIds];
    }
};

// --- Images ---
const getImageUrl = (id) => `/items/${id}.webp`;
const handleImageError = (e) => { e.target.src = 'https://placehold.co/200x200/1a1a1a/FFF?text=No+Image'; };
const getRarityClass = (rarity) => `rarity-${rarity.toLowerCase()}`;
</script>

<template>
    <div class="tracker-container">

        <div v-if="tutorialStep > 0" class="tutorial-backdrop" @click="skipTutorial"></div>

        <div class="controls" :class="{ 'tutorial-active': tutorialStep > 0 }">
            <div class="top-row">
                <input type="text" v-model="searchQuery" :placeholder="$t('tracker.searchPlaceholder')"
                    class="search-bar" />
                <select v-model="sortOrder" class="control-select">
                    <option value="name_asc">{{ $t('tracker.sortNameAZ') }}</option>
                    <option value="name_desc">{{ $t('tracker.sortNameZA') }}</option>
                    <option value="rarity_asc">{{ $t('tracker.sortRarityLowHigh') }}</option>
                    <option value="rarity_desc">{{ $t('tracker.sortRarityHighLow') }}</option>
                </select>
                <select v-model="itemsPerRow" class="control-select columns-select">
                    <option v-for="opt in columnOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }} {{ $t('tracker.cols') }}
                    </option>
                </select>
                <select v-model="currentLang" class="control-select lang-select">
                    <option v-for="opt in langOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>

                <div class="tutorial-wrapper buttons-row">
                    <button @click="showQuestModal = true" class="quest-log-btn">
                        {{ $t('tracker.questLogBtn') }}
                    </button>
                    <button @click="showProjectModal = true" class="project-log-btn">
                        {{ $t('tracker.projectLogBtn') }}
                    </button>
                    <button @click="showHideoutModal = true" class="hideout-log-btn">
                        🏠 {{ $t('tracker.hideoutLogBtn') }}
                    </button>

                    <transition name="pop">
                        <div v-if="tutorialStep === 1" class="tutorial-bubble quest-bubble">
                            <div class="arrow-up"></div>
                            <h4>{{ $t('tracker.tutQuestTitle') }} <span class="badge-new">✨</span></h4>
                            <p>{{ $t('tracker.tutQuestDesc') }}</p>
                            <button class="tut-btn" @click.stop="nextTutorialStep">{{ $t('tracker.tutNext') }}
                                →</button>
                        </div>
                    </transition>
                    <transition name="pop">
                        <div v-if="tutorialStep === 2" class="tutorial-bubble project-bubble">
                            <div class="arrow-dynamic"></div>
                            <h4>{{ $t('tracker.tutProjTitle') }} <span class="badge-new">✨</span></h4>
                            <p>{{ $t('tracker.tutProjDesc') }}</p>
                            <button class="tut-btn finish" @click.stop="finishTutorial">✅ {{ $t('tracker.tutFinish')
                                }}</button>
                        </div>
                    </transition>
                </div>
            </div>

            <div class="filter-row">
                <div class="filter-group">
                    <span class="filter-label">{{ $t('tracker.rarity') }}:</span>
                    <div class="checkbox-wrapper">
                        <label v-for="rarity in rarities" :key="rarity" :class="getRarityClass(rarity)">
                            <input type="checkbox" :value="rarity" v-model="selectedRarities" />
                            {{ rarity }}
                        </label>
                    </div>
                </div>
                <div class="filter-group">
                    <span class="filter-label">{{ $t('tracker.action') }}:</span>
                    <div class="checkbox-wrapper">
                        <label v-for="act in actions" :key="act.value" :style="{ color: act.color }">
                            <input type="checkbox" :value="act.value" v-model="selectedActions" />
                            {{ $t(act.i18nKey) }}
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showQuestModal" class="modal-backdrop" @click.self="showQuestModal = false">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>{{ $t('tracker.questModalTitle') }}</h2>
                    <button class="close-btn" @click="showQuestModal = false">✕</button>
                </div>
                <div class="modal-controls">
                    <input type="text" v-model="questSearchQuery" :placeholder="$t('tracker.searchQuest')"
                        class="modal-search" />
                    <button class="select-all-btn" @click="toggleAllQuestsVisible"
                        :class="{ 'active': areAllQuestsVisibleSelected }">
                        {{ areAllQuestsVisibleSelected ? $t('tracker.deselectAll') : $t('tracker.selectAll') }}
                    </button>
                    <label class="toggle-switch">
                        <input type="checkbox" v-model="showOnlyLootQuests" />
                        <span class="slider"></span>
                        <span class="toggle-label">{{ $t('tracker.onlyLootQuests') }}</span>
                    </label>
                </div>
                <div class="quest-list">
                    <div v-for="quest in filteredQuestList" :key="quest.id" class="quest-item">
                        <label class="quest-checkbox-label">
                            <input type="checkbox" :value="quest.id" v-model="completedQuests" />
                            <span class="quest-info">
                                <span class="quest-name">{{ getLocName(quest) }}</span>
                                <span class="quest-trader">{{ quest.trader }}</span>
                            </span>
                        </label>
                        <div v-if="quest.hasObtains" class="quest-requirements">
                            <span v-for="req in quest.requiredItems" :key="req.id" class="req-badge">
                                {{ req.amount }}x {{ resolveItemName(req.id, req.name) }}
                            </span>
                        </div>
                    </div>
                    <div v-if="filteredQuestList.length === 0" class="no-quests">{{ $t('tracker.noResults') }}</div>
                </div>
            </div>
        </div>

        <div v-if="showProjectModal" class="modal-backdrop" @click.self="showProjectModal = false">
            <div class="modal-content project-modal">
                <div class="modal-header project-header">
                    <h2>{{ $t('tracker.projectModalTitle') }}</h2>
                    <button class="close-btn" @click="showProjectModal = false">✕</button>
                </div>
                <div class="modal-controls">
                    <input type="text" v-model="projectSearchQuery" :placeholder="$t('tracker.searchProject')"
                        class="modal-search" />
                    <button class="select-all-btn" @click="toggleAllProjectsVisible"
                        :class="{ 'active': areAllProjectsVisibleSelected }">
                        {{ areAllProjectsVisibleSelected ? $t('tracker.deselectAll') : $t('tracker.selectAll') }}
                    </button>
                </div>
                <div class="quest-list">
                    <div v-for="proj in filteredProjectList" :key="proj.id" class="quest-item">
                        <label class="quest-checkbox-label">
                            <input type="checkbox" :value="proj.id" v-model="completedProjects" />
                            <span class="quest-info">
                                <span class="quest-name">{{ getLocName(proj) }}</span>
                                <span class="quest-trader">{{ proj.trader }}</span>
                            </span>
                        </label>
                        <div class="quest-requirements">
                            <span v-for="req in proj.requiredItems" :key="req.id" class="req-badge proj-badge">
                                {{ req.amount }}x {{ resolveItemName(req.id, req.name) }}
                            </span>
                        </div>
                    </div>
                    <div v-if="filteredProjectList.length === 0" class="no-quests">{{ $t('tracker.noResults') }}</div>
                </div>
            </div>
        </div>

        <div v-if="showHideoutModal" class="modal-backdrop" @click.self="showHideoutModal = false">
            <div class="modal-content hideout-modal">
                <div class="modal-header hideout-header">
                    <h2>{{ $t('tracker.hideoutModalTitle') }}</h2>
                    <button class="close-btn" @click="showHideoutModal = false">✕</button>
                </div>
                <div class="modal-controls">
                    <input type="text" v-model="hideoutSearchQuery" :placeholder="$t('tracker.searchHideout')"
                        class="modal-search" />
                    <button class="select-all-btn" @click="toggleAllHideoutVisible"
                        :class="{ 'active': areAllHideoutVisibleSelected }">
                        {{ areAllHideoutVisibleSelected ? $t('tracker.deselectAll') : $t('tracker.selectAll') }}
                    </button>
                </div>

                <div class="quest-list">
                    <div v-for="station in filteredHideoutList" :key="station.id" class="hideout-station-group">
                        <h3 class="hideout-station-title">{{ getLocName(station) }}</h3>

                        <div v-for="lvl in station.levels" :key="lvl.level" class="hideout-level-item">
                            <label class="quest-checkbox-label">
                                <input type="checkbox" :value="`${station.id}_${lvl.level}`"
                                    v-model="completedHideoutLevels" />
                                <span class="quest-info">
                                    <span class="quest-name">Level {{ lvl.level }}</span>
                                </span>
                            </label>

                            <div class="quest-requirements">
                                <span v-for="req in lvl.requiredItems" :key="req.id" class="req-badge hideout-badge">
                                    {{ req.amount }}x {{ resolveItemName(req.id, req.name) }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div v-if="filteredHideoutList.length === 0" class="no-quests">{{ $t('tracker.noResults') }}</div>
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
                    <h3 class="item-name">{{ item._locName }}</h3>
                    <div class="info-row">
                        <span class="rarity-tag">{{ item.rarity }}</span>
                        <span class="value-tag">💰 {{ item.value }}</span>
                    </div>

                    <div v-if="item.isQuestItem && item.activeQuests.length > 0" class="quest-active-box">
                        <span class="quest-label">{{ $t('tracker.neededFor') }}</span>
                        <ul class="quest-names">
                            <li v-for="q in item.activeQuests" :key="q.questId">
                                <span v-if="q.type === 'project'">[P] </span>
                                <span v-else-if="q.type === 'hideout'">[H] </span>
                                <span v-else>[Q] </span>
                                {{ q.amount }}x {{ q.questName }}
                            </li>
                        </ul>
                    </div>
                    <div v-if="item.action === 'recycle' && getLocYield(item)" class="yield-box">
                        <span class="label">{{ $t('tracker.yieldLabel') }}</span>
                        <p class="yield-text">{{ getLocYield(item) }}</p>
                    </div>
                    <div v-else-if="!item.isQuestItem" class="yield-box simple">
                        <span v-if="item.action === 'keep'" class="action-text">✅ Keep</span>
                        <span v-if="item.action === 'sell'" class="action-text">💲 Sell</span>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="filteredItems.length === 0" class="empty-state">
            {{ $t('tracker.noResults') }}
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
}

.controls.tutorial-active {
    z-index: 2001;
}

.top-row {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: center;
}

.buttons-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.hideout-log-btn {
    background: #8e44ad;
    /* Violett für Hideout */
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

.hideout-log-btn:hover {
    background: #732d91;
}

.modal-header.hideout-header {
    background: #8e44ad;
    color: #fff;
}

.modal-header.hideout-header h2 {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.modal-header.hideout-header .close-btn {
    color: white;
}

.req-badge.hideout-badge {
    background: rgba(142, 68, 173, 0.2);
    border: 1px solid rgba(142, 68, 173, 0.4);
    color: #d2b4de;
}

/* ... Deine existierenden Styles ... */

/* Mobile Anpassung für die Buttons */
@media (max-width: 768px) {
    .buttons-row {
        flex-direction: column;
        width: 100%;
    }

    .hideout-log-btn {
        width: 100%;
    }
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

/* BUTTONS */
.quest-log-btn,
.project-log-btn {
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

.quest-log-btn {
    background: #3498db;
}

.quest-log-btn:hover {
    background: #2980b9;
}

.project-log-btn {
    background: #e67e22;
}

.project-log-btn:hover {
    background: #d35400;
}

/* --- FILTER ROW --- */
.filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    align-items: center;
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

/* --- TUTORIAL STYLES --- */
.tutorial-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 2000;
    animation: fadeIn 0.3s ease-in-out;
}

.tutorial-wrapper {
    position: relative;
}

.tutorial-bubble {
    position: absolute;
    background: white;
    color: #121212;
    padding: 18px;
    border-radius: 8px;
    width: 280px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    text-align: left;
    z-index: 2005;
}

.pop-enter-active,
.pop-leave-active {
    transition: all 0.3s ease;
}

.pop-enter-from,
.pop-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
}

.quest-bubble {
    top: 60px;
    right: 0;
}

.quest-bubble .arrow-up {
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid white;
    position: absolute;
    top: -10px;
    right: 20px;
}

.project-bubble {
    bottom: 60px;
    right: 0;
}

.arrow-dynamic {
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid white;
    position: absolute;
    bottom: -10px;
    right: 20px;
}

.tutorial-bubble h4 {
    margin: 0 0 8px 0;
    color: #3498db;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
}

.badge-new {
    background: #e74c3c;
    color: white;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    vertical-align: middle;
}

.tutorial-bubble p {
    margin: 0 0 12px 0;
    font-size: 0.9rem;
    line-height: 1.4;
    color: #333;
}

.tut-tip {
    background: #f0f8ff;
    padding: 8px;
    border-radius: 6px;
    font-size: 0.85rem;
    color: #2980b9;
    margin-bottom: 15px;
    border-left: 3px solid #3498db;
}

.tut-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.9rem;
    float: right;
    transition: background 0.2s;
}

.tut-btn:hover {
    background: #2980b9;
}

.tut-btn.finish {
    background: #2ecc71;
}

.tut-btn.finish:hover {
    background: #27ae60;
}

/* --- MOBILE SPECIFIC LOGIC --- */
@media (max-width: 768px) {
    .top-row {
        flex-direction: column;
        align-items: stretch;
    }

    .search-bar,
    .control-select,
    .tutorial-wrapper,
    .quest-log-btn {
        width: 100%;
    }

    .filter-row {
        flex-direction: column;
        align-items: stretch;
        gap: 20px;
    }

    .project-btn-wrapper {
        order: -1;
        margin-bottom: 10px;
        width: 100%;
    }

    .project-log-btn {
        width: 100%;
    }

    .quest-bubble {
        right: 0;
        width: auto;
        min-width: 250px;
    }

    .project-bubble {
        bottom: auto;
        top: 60px;
    }

    .project-bubble .arrow-dynamic {
        border-top: none;
        border-bottom: 10px solid white;
        top: -10px;
        bottom: auto;
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

.modal-header.project-header {
    background: #e67e22;
    color: #fff;
}

.modal-header.project-header h2 {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.modal-header.project-header .close-btn {
    color: white;
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

.req-badge.proj-badge {
    background: rgba(230, 126, 34, 0.2);
    border-color: rgba(230, 126, 34, 0.4);
    color: #f5cba7;
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

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* --- GRID & CARDS --- */
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

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

.hideout-station-group {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #444;
}

.hideout-station-title {
    margin: 0 0 10px 0;
    color: #8e44ad;
    font-size: 1.1rem;
    border-bottom: 1px solid #555;
    padding-bottom: 5px;
}

.hideout-level-item {
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.hideout-level-item:last-child {
    border-bottom: none;
}
</style>