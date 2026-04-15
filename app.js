const CONFIG = {
    DAILY_GOAL: 26.67,
    CURRENCY: '€',
    STORAGE_KEY: 'aida_drink_tracker_v1',
};

let state = {
    currentDay: null,
    archive: [],
};

const elements = {};

// Stammdatenquelle (später ggf. durch CSV-Import ersetzt)
const drinksData = [
    {
        id: 'd1',
        name: 'APEROL SPRIZZ',
        category: 'Sprizz',
        price: 9.2,
        isNonAlcoholic: false,
        isAI: true,
    },
    {
        id: 'd2',
        name: 'RADEBERGER 0,5 l',
        category: 'Bier vom Fass',
        price: 5.5,
        isNonAlcoholic: false,
        isAI: true,
    },
    {
        id: 'd3',
        name: 'MOJITO',
        category: 'Cocktail',
        price: 9.2,
        isNonAlcoholic: false,
        isAI: true,
    },
    {
        id: 'd4',
        name: 'CAPPUCCINO',
        category: 'Kaffee',
        price: 4.1,
        isNonAlcoholic: true,
        isAI: true,
    },
    {
        id: 'd5',
        name: 'COCA-COLA 0,2 l',
        category: 'Softdrink',
        price: 2.6,
        isNonAlcoholic: true,
        isAI: true,
    },
];

const favorites = drinksData.slice(0, 4);

// --- 1. DATEN-NORMALISIERUNG & ZENTRALE BERECHNUNG ---

function normalizeDay(dayData, fallbackDayNumber = 1) {
    if (!dayData) dayData = {};

    // Grundgerüst eines Tages erzwingen
    const normalized = {
        day: Number(dayData.day) || fallbackDayNumber,
        date: dayData.date || new Date().toISOString(),
        drinks: [],
        total: 0, // Wird unten immer abgeleitet berechnet
    };

    // Hybridmodell sicherstellen: Snapshot-Werte übernehmen und validieren
    if (Array.isArray(dayData.drinks)) {
        normalized.drinks = dayData.drinks.map((drink) => {
            return {
                id: String(drink.id || 'unknown'),
                name: String(drink.name || 'Unbekanntes Getränk'),
                price: Number(drink.price) || 0,
                isNonAlcoholic: drink.isNonAlcoholic === true,
                timestamp: drink.timestamp || new Date().toISOString(),
            };
        });
    }

    // `total` ist ein rein abgeleiteter Wert der normalisierten Drinks
    normalized.total = calculateTotal(normalized.drinks);

    return normalized;
}

function calculateTotal(drinks) {
    if (!Array.isArray(drinks)) return 0;
    return drinks.reduce((sum, item) => sum + item.price, 0);
}

function createNewDay(dayNumber) {
    return normalizeDay({ day: dayNumber });
}

// --- 2. AGGREGATION FÜR SPÄTERE AUSWERTUNGEN ---

function getAggregatedStats() {
    const allDays = [...state.archive, state.currentDay].filter(Boolean);
    const stats = {
        grandTotal: 0,
        totalDrinks: 0,
        byDrink: {}, // Vorbereitung für z.B. "Top Drinks"
    };

    allDays.forEach((day) => {
        stats.grandTotal += day.total;
        stats.totalDrinks += day.drinks.length;

        day.drinks.forEach((drink) => {
            if (!stats.byDrink[drink.id]) {
                stats.byDrink[drink.id] = {
                    id: drink.id,
                    latestName: drink.name, // Historischer Name als Fallback
                    count: 0,
                    totalSpent: 0,
                };
            }
            stats.byDrink[drink.id].count += 1;
            stats.byDrink[drink.id].totalSpent += drink.price;
            stats.byDrink[drink.id].latestName = drink.name;
        });
    });

    return stats;
}

// --- 3. STATE MANAGEMENT ---

function loadState() {
    try {
        const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);

            // Archiv normalisieren
            state.archive = Array.isArray(parsedData.archive)
                ? parsedData.archive.map((day, index) => normalizeDay(day, index + 1))
                : [];

            // Aktuellen Tag normalisieren (mit Fallback für Legacy-Daten)
            let currentRaw = parsedData.currentDay;
            if (!currentRaw && parsedData.consumedDrinks) {
                currentRaw = {
                    day: parsedData.dayCounter || 1,
                    drinks: parsedData.consumedDrinks,
                };
            }

            state.currentDay = normalizeDay(currentRaw, state.archive.length + 1);
        } else {
            state.currentDay = createNewDay(1);
        }
    } catch (error) {
        console.warn('Defekte lokale Daten gefunden, starte sauber neu:', error);
        state.currentDay = createNewDay(1);
        state.archive = [];
    }

    saveState(); // Reparierte/Normalisierte Daten direkt zurückspeichern
}

function saveState() {
    try {
        localStorage.setItem(
            CONFIG.STORAGE_KEY,
            JSON.stringify({
                currentDay: state.currentDay,
                archive: state.archive,
            }),
        );
    } catch (error) {
        console.error('Fehler beim Speichern der Daten:', error);
    }
}

// --- 4. AKTIONEN ---

function addDrink(drink) {
    if (!drink || !drink.name) return;

    state.currentDay.drinks.push({
        id: drink.id || 'custom',
        name: drink.name,
        category: drink.category || 'Cocktail',
        price: Number(drink.price) || 0,
        isNonAlcoholic: drink.isNonAlcoholic ?? false,
        timestamp: new Date().toISOString(),
    });

    state.currentDay.total = calculateTotal(state.currentDay.drinks);
    saveState();
    updateUI();
}

function undoLastDrink() {
    if (state.currentDay.drinks.length === 0) return;

    state.currentDay.drinks.pop();
    state.currentDay.total = calculateTotal(state.currentDay.drinks);

    saveState();
    updateUI();
}

function startNewDay() {
    if (state.currentDay.drinks.length === 0) {
        alert('Dieser Tag enthält noch keine Getränke.');
        return;
    }

    if (
        confirm(`Möchtest du Tag ${state.currentDay.day} wirklich abschließen?\nEin neuer, leerer Tag wird gestartet.`)
    ) {
        // Tag ins Archiv schieben (Kopie erzeugen)
        state.archive.push(JSON.parse(JSON.stringify(state.currentDay)));
        // Neuen Tag initialisieren
        state.currentDay = createNewDay(state.currentDay.day + 1);

        saveState();
        updateUI();
    }
}

// --- 5. UI RENDERING ---

function formatCurrency(amount) {
    return `${amount.toFixed(2).replace('.', ',')} ${CONFIG.CURRENCY}`;
}

function getCategoryIcon(category) {
    const icons = {
        Sprizz: '🍹',
        'Bier vom Fass': '🍺',
        Flaschenbier: '🍺',
        Cocktail: '🍸',
        Kaffee: '☕',
        Softdrink: '🥤',
        Wasser: '💧',
        'Wein - WEISS': '🥂',
        'Wein - ROT': '🍷',
        'Säfte. Nektar & Schorlen': '🧃',
    };
    return icons[category] || '🥃';
}

function init() {
    loadState();

    elements.favGrid = document.getElementById('fav-grid');
    elements.drinkList = document.getElementById('drink-list');
    elements.totalAmount = document.getElementById('total-amount');
    elements.statusLight = document.getElementById('status-light');
    elements.progressBar = document.getElementById('progress-bar');
    elements.dayLabel = document.getElementById('day-label');
    elements.historyList = document.getElementById('history-list');

    elements.undoBtn = document.getElementById('undo-btn');
    elements.nextDayBtn = document.getElementById('next-day-btn');

    elements.viewToday = document.getElementById('view-today');
    elements.viewOverview = document.getElementById('view-overview');
    elements.overviewList = document.getElementById('overview-list');
    elements.grandTotalAmount = document.getElementById('grand-total-amount');
    elements.grandTotalCount = document.getElementById('grand-total-count');

    elements.undoBtn.addEventListener('click', undoLastDrink);
    elements.nextDayBtn.addEventListener('click', startNewDay);

    renderFavorites();
    renderDrinkList();
    updateUI();
    initAccordions();
}

let isOverviewVisible = false;

// function toggleOverview() {
//     isOverviewVisible = !isOverviewVisible;

//     if (isOverviewVisible) {
//         elements.viewToday.classList.add("hidden");
//         elements.viewOverview.classList.remove("hidden");
//         elements.overviewBtn.textContent = "✕";
//         renderOverview();
//     } else {
//         elements.viewToday.classList.remove("hidden");
//         elements.viewOverview.classList.add("hidden");
//         elements.overviewBtn.textContent = "📊";
//     }
// }

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
    document.getElementById(`view-${screenId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.screen === screenId);
    });

    if (screenId === 'dashboard') renderOverview();
    if (screenId === 'history') renderHistory();
}

// Event Listener für die Bottom-Nav
document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
});

function renderOverview() {
    const stats = getAggregatedStats();

    const limit = 240;
    const spent = stats.grandTotal;
    const remaining = Math.max(limit - spent, 0);
    const circumference = 691;
    const percentage = Math.min(spent / limit, 1);

    document.getElementById('grand-total-display').textContent = formatCurrency(spent);
    document.getElementById('stats-spent').textContent = formatCurrency(spent);
    document.getElementById('stats-remaining').textContent = formatCurrency(remaining);

    const ring = document.getElementById('overall-progress-ring');
    if (ring) {
        const offset = circumference - percentage * circumference;
        ring.style.strokeDashoffset = offset;
    }

    const badge = document.getElementById('status-badge');
    if (percentage >= 1) {
        badge.className = 'badge-blue';
    }

    document.getElementById('status-badge').textContent = `${Math.round(percentage * 100)}% erreicht`;
    document.getElementById('total-drinks-count').textContent = `Gesamtanzahl: ${stats.totalDrinks}`;

    const topList = document.getElementById('top-drinks-list');
    topList.innerHTML = '';

    const topDrinks = Object.values(stats.byDrink)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    topDrinks.forEach((drink) => {
        const item = document.createElement('div');
        item.className = 'drink-item tonal-card';
        item.innerHTML = `
            <div class="drink-item-info">
                <span class="drink-item-name">${drink.latestName}</span>
                <span class="text-xs color-primary">${drink.count}x bestellt</span>
            </div>
            <span class="drink-item-price">${formatCurrency(drink.totalSpent)}</span>
        `;
        topList.appendChild(item);
    });
}

function renderFavorites() {
    elements.favGrid.innerHTML = '';
    favorites.forEach((drink) => {
        const btn = document.createElement('button');
        btn.className = 'fav-card';
        btn.innerHTML = `
            <span class="fav-name">${drink.name}</span>
            <span class="fav-price">${formatCurrency(drink.price)}</span>
        `;
        btn.addEventListener('click', () => addDrink(drink));
        elements.favGrid.appendChild(btn);
    });
}

function renderDrinkList() {
    const list = document.getElementById('drink-list');
    list.innerHTML = '';

    drinksData.forEach((drink) => {
        const div = document.createElement('div');
        div.className = 'drink-item';
        div.innerHTML = `
            <div class="drink-item-info">
                <span class="drink-item-name">${drink.name}</span>
                <span class="text-xs uppercase tracking-widest text-outline">${drink.category}</span>
            </div>
            <span class="drink-item-price">${formatCurrency(drink.price)}</span>
        `;
        div.addEventListener('click', () => addDrink(drink));
        list.appendChild(div);
    });
}

function renderHistory() {
    const container = document.getElementById('history-groups-container');
    container.innerHTML = '';

    if (state.currentDay.drinks.length === 0) {
        container.innerHTML = '<p class="text-sm text-center py-8 opacity-50 italic">Noch keine Getränke erfasst.</p>';
        updateSummary(0, 0, 0);
        return;
    }

    const groups = { Nacht: [], Abend: [], Nachmittag: [], Vormittag: [] };
    state.currentDay.drinks.forEach((drink) => {
        const group = getTimeGroupName(drink.timestamp);
        groups[group].unshift(drink);
    });

    ['Abend', 'Nachmittag', 'Vormittag', 'Nacht'].forEach((groupName) => {
        const groupDrinks = groups[groupName];
        if (groupDrinks.length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'history-group';
        groupDiv.innerHTML = `<div class="history-group-label">${groupName}</div>`;

        groupDrinks.forEach((entry) => {
            const time = new Date(entry.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
            const iconName = getMaterialIcon(entry.category);

            const card = document.createElement('div');
            card.className = 'history-item-card';

            card.innerHTML = `
                <div class="card-row-main">
                    <div class="category-icon-wrapper-sm">
                        <span class="material-symbols-outlined">${iconName}</span>
                    </div>
                    <span class="drink-name-primary">${entry.name}</span>
                </div>
                <div class="card-row-details">
                    <span class="history-time-stamp">${time} Uhr</span>
                    <span class="history-price-tag">${formatCurrency(entry.price)}</span>
                </div>
            `;
            groupDiv.appendChild(card);
        });
        container.appendChild(groupDiv);
    });

    const alcoholicCount = state.currentDay.drinks.filter((d) => d.isNonAlcoholic === false).length;
    updateSummary(state.currentDay.drinks.length, alcoholicCount, state.currentDay.total);
}

function getTimeGroupName(timestamp) {
    const hour = new Date(timestamp).getHours();
    if (hour >= 6 && hour < 12) return 'Vormittag';
    if (hour >= 12 && hour < 18) return 'Nachmittag';
    if (hour >= 18 && hour < 24) return 'Abend';
    return 'Nacht';
}

function updateSummary(count, alcoholicCount, total) {
    document.getElementById('summary-count').textContent = count;
    document.getElementById('summary-alcohol-count').textContent = alcoholicCount;
    document.getElementById('summary-budget-total').textContent = formatCurrency(total);

    const percentage = Math.min((total / CONFIG.DAILY_GOAL) * 100, 100);
    document.getElementById('summary-budget-fill').style.width = `${percentage}%`;
}

function updateUI() {
    if (elements.dayLabel) elements.dayLabel.textContent = `Tag ${state.currentDay.day}`;
    elements.totalAmount.textContent = formatCurrency(state.currentDay.total);

    elements.undoBtn.disabled = state.currentDay.drinks.length === 0;
    renderHistory();
    if (isOverviewVisible) renderOverview();

    const goal = CONFIG.DAILY_GOAL;
    const total = state.currentDay.total;
    const percentage = Math.min(total / goal, 1);

    const ring = document.getElementById('progress-ring');
    const offset = 477 - percentage * 477;
    ring.style.strokeDashoffset = offset;

    if (total < goal * 0.75) {
        ring.style.stroke = 'var(--color-error)';
    } else if (total < goal) {
        ring.style.stroke = 'var(--color-warning)';
    } else {
        ring.style.stroke = 'var(--color-safe)';
    }

    const remaining = Math.max(goal - total, 0);
    document.getElementById('limit-info').textContent = `Limit verbleibend: ${formatCurrency(remaining)}`;
}

function getMaterialIcon(category) {
    const icons = {
        Sprizz: 'local_bar',
        'Bier vom Fass': 'sports_bar',
        Flaschenbier: 'sports_bar',
        Cocktail: 'local_bar',
        Kaffee: 'coffee',
        Softdrink: 'local_drink',
        Wasser: 'water_drop',
        'Wein - WEISS': 'wine_bar',
        'Wein - ROT': 'wine_bar',
        'Säfte. Nektar & Schorlen': 'local_drink',
    };
    return icons[category] || 'liquor';
}

// ─── Akkordeon-Toggle ─────────────────────────────────────────

function initAccordions() {
    const categoryItems = document.querySelectorAll('.category-item');

    categoryItems.forEach((item) => {
        const header = item.querySelector('.category-header');
        const content = item.querySelector('.category-content');
        const iconWrapper = item.querySelector('.category-icon-wrapper');
        const icon = item.querySelector('.category-header .material-symbols-outlined:last-child');

        if (!header) return;

        header.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');

            categoryItems.forEach((other) => {
                if (other !== item) {
                    other.classList.remove('is-open');
                    const otherContent = other.querySelector('.category-content');
                    if (otherContent) otherContent.style.display = 'none';
                }
            });

            if (isOpen) {
                item.classList.remove('is-open');
                if (content) content.style.display = 'none';
            } else {
                item.classList.add('is-open');
                if (content) content.style.display = 'block';
            }
        });

        if (content) content.style.display = 'none';
    });
}

init();
