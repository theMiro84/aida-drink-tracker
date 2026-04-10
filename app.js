const CONFIG = {
  DAILY_GOAL: 26.67,
  CURRENCY: "€",
  STORAGE_KEY: "aida_drink_tracker_v1",
};

let state = {
  currentDay: null,
  archive: [],
};

const elements = {};

// Stammdatenquelle (später ggf. durch CSV-Import ersetzt)
const drinksData = [
  {
    id: "d1",
    name: "APEROL SPRIZZ",
    category: "Sprizz",
    price: 9.2,
    isNonAlcoholic: false,
    isAI: true,
  },
  {
    id: "d2",
    name: "RADEBERGER 0,5 l",
    category: "Bier vom Fass",
    price: 5.5,
    isNonAlcoholic: false,
    isAI: true,
  },
  {
    id: "d3",
    name: "MOJITO",
    category: "Cocktail",
    price: 9.2,
    isNonAlcoholic: false,
    isAI: true,
  },
  {
    id: "d4",
    name: "CAPPUCCINO",
    category: "Kaffee",
    price: 4.1,
    isNonAlcoholic: true,
    isAI: true,
  },
  {
    id: "d5",
    name: "COCA-COLA 0,2 l",
    category: "Softdrink",
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
        id: String(drink.id || "unknown"),
        name: String(drink.name || "Unbekanntes Getränk"),
        price: Number(drink.price) || 0,
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
    console.warn("Defekte lokale Daten gefunden, starte sauber neu:", error);
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
    console.error("Fehler beim Speichern der Daten:", error);
  }
}

// --- 4. AKTIONEN ---

function addDrink(drink) {
  // Es wird ein Snapshot gespeichert (Hybridmodell)
  state.currentDay.drinks.push({
    id: drink.id,
    name: drink.name,
    price: Number(drink.price) || 0,
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
    alert("Dieser Tag enthält noch keine Getränke.");
    return;
  }

  if (
    confirm(
      `Möchtest du Tag ${state.currentDay.day} wirklich abschließen?\nEin neuer, leerer Tag wird gestartet.`,
    )
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
  return `${amount.toFixed(2).replace(".", ",")} ${CONFIG.CURRENCY}`;
}

function getCategoryIcon(category) {
  const icons = {
    Sprizz: "🍹",
    "Bier vom Fass": "🍺",
    Flaschenbier: "🍺",
    Cocktail: "🍸",
    Kaffee: "☕",
    Softdrink: "🥤",
    Wasser: "💧",
    "Wein - WEISS": "🥂",
    "Wein - ROT": "🍷",
    "Säfte. Nektar & Schorlen": "🧃",
  };
  return icons[category] || "🥃";
}

function init() {
  loadState();

  elements.favGrid = document.getElementById("fav-grid");
  elements.drinkList = document.getElementById("drink-list");
  elements.totalAmount = document.getElementById("total-amount");
  elements.statusLight = document.getElementById("status-light");
  elements.progressBar = document.getElementById("progress-bar");
  elements.dayLabel = document.getElementById("day-label");
  elements.historyList = document.getElementById("history-list");

  elements.undoBtn = document.getElementById("undo-btn");
  elements.nextDayBtn = document.getElementById("next-day-btn");
  elements.overviewBtn = document.getElementById("overview-btn");

  elements.viewToday = document.getElementById("view-today");
  elements.viewOverview = document.getElementById("view-overview");
  elements.overviewList = document.getElementById("overview-list");
  elements.grandTotalAmount = document.getElementById("grand-total-amount");
  elements.grandTotalCount = document.getElementById("grand-total-count");

  elements.undoBtn.addEventListener("click", undoLastDrink);
  elements.nextDayBtn.addEventListener("click", startNewDay);
  elements.overviewBtn.addEventListener("click", toggleOverview);

  renderFavorites();
  renderDrinkList();
  updateUI();
}

let isOverviewVisible = false;

function toggleOverview() {
  isOverviewVisible = !isOverviewVisible;

  if (isOverviewVisible) {
    elements.viewToday.classList.add("hidden");
    elements.viewOverview.classList.remove("hidden");
    elements.overviewBtn.textContent = "✕";
    renderOverview();
  } else {
    elements.viewToday.classList.remove("hidden");
    elements.viewOverview.classList.add("hidden");
    elements.overviewBtn.textContent = "📊";
  }
}

function renderOverview() {
  const allDays = [...state.archive, state.currentDay];
  const stats = getAggregatedStats();

  elements.overviewList.innerHTML = "";

  allDays.forEach((dayData) => {
    if (dayData.drinks.length === 0 && dayData.day !== state.currentDay.day)
      return;

    const li = document.createElement("li");
    li.className = "list-item";

    li.innerHTML = `
            <div class="overview-day">Tag ${dayData.day}</div>
            <div class="overview-details">
                <span class="overview-total">${formatCurrency(dayData.total)}</span>
                <span class="overview-count">${dayData.drinks.length} Getränke</span>
            </div>
        `;
    elements.overviewList.appendChild(li);
  });

  elements.grandTotalAmount.textContent = formatCurrency(stats.grandTotal);
  if (elements.grandTotalCount) {
    elements.grandTotalCount.textContent = `${stats.totalDrinks} Getränke erfasst`;
  }
}

function renderFavorites() {
  elements.favGrid.innerHTML = "";
  favorites.forEach((drink) => {
    const btn = document.createElement("button");
    btn.className = "fav-btn";
    btn.innerHTML = `<span class="icon">${getCategoryIcon(drink.category)}</span><span>${drink.name}</span><small>${formatCurrency(drink.price)}</small>`;
    btn.addEventListener("click", () => addDrink(drink));
    elements.favGrid.appendChild(btn);
  });
}

function renderDrinkList() {
  elements.drinkList.innerHTML = "";
  drinksData.forEach((drink) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
            <div class="drink-info">
                <span class="drink-icon">${getCategoryIcon(drink.category)}</span>
                <div class="drink-text">
                    <span class="drink-name">${drink.name}</span>
                    <span class="drink-price">${formatCurrency(drink.price)}</span>
                </div>
            </div>
            <button class="add-btn">+</button>
        `;
    li.querySelector(".add-btn").addEventListener("click", () =>
      addDrink(drink),
    );
    elements.drinkList.appendChild(li);
  });
}

function renderHistory() {
  elements.historyList.innerHTML = "";

  if (state.currentDay.drinks.length === 0) {
    elements.historyList.innerHTML =
      '<li class="history-empty">Noch keine Getränke erfasst.</li>';
    return;
  }

  const recentDrinks = state.currentDay.drinks.slice(-3).reverse();

  recentDrinks.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = `history-item ${index === 0 ? "newest" : ""}`;

    if (index === 0) {
      li.innerHTML = `<div class="history-item-main"><small class="undo-hint">Zuletzt hinzugefügt</small><span>${entry.name}</span></div><span>${formatCurrency(entry.price)}</span>`;
    } else {
      li.innerHTML = `<span>${entry.name}</span><span>${formatCurrency(entry.price)}</span>`;
    }

    elements.historyList.appendChild(li);
  });
}

function updateUI() {
  if (elements.dayLabel)
    elements.dayLabel.textContent = `Tag ${state.currentDay.day}`;
  elements.totalAmount.textContent = formatCurrency(state.currentDay.total);

  let percentage = (state.currentDay.total / CONFIG.DAILY_GOAL) * 100;
  elements.progressBar.style.width = `${Math.min(percentage, 100)}%`;

  elements.statusLight.classList.remove(
    "light-red",
    "light-yellow",
    "light-green",
  );
  if (state.currentDay.total === 0) {
    elements.statusLight.classList.add("light-red");
    elements.progressBar.style.backgroundColor = "var(--system-red)";
  } else if (state.currentDay.total < CONFIG.DAILY_GOAL) {
    elements.statusLight.classList.add("light-yellow");
    elements.progressBar.style.backgroundColor = "var(--system-yellow)";
  } else {
    elements.statusLight.classList.add("light-green");
    elements.progressBar.style.backgroundColor = "var(--system-green)";
  }

  elements.undoBtn.disabled = state.currentDay.drinks.length === 0;
  renderHistory();
  if (isOverviewVisible) renderOverview();
}

init();
