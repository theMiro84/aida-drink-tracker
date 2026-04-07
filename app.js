// --- Konfiguration ---
const CONFIG = {
    DAILY_GOAL: 26.67,
    CURRENCY: '€',
    STORAGE_KEY: 'aida_drink_tracker_v1' 
};

// --- App State (Zustand) ---
let state = {
    currentTotal: 0,
    consumedDrinks: [] 
};

const elements = {};

const drinksData = [
    { id: 'd1', name: "APEROL SPRIZZ", category: "Sprizz", price: 9.20, isNonAlcoholic: false, isAI: true },
    { id: 'd2', name: "RADEBERGER 0,5 l", category: "Bier vom Fass", price: 5.50, isNonAlcoholic: false, isAI: true },
    { id: 'd3', name: "MOJITO", category: "Cocktail", price: 9.20, isNonAlcoholic: false, isAI: true },
    { id: 'd4', name: "CAPPUCCINO", category: "Kaffee", price: 4.10, isNonAlcoholic: true, isAI: true },
    { id: 'd5', name: "COCA-COLA 0,2 l", category: "Softdrink", price: 2.60, isNonAlcoholic: true, isAI: true }
];

const favorites = drinksData.slice(0, 4);

// --- NEU: Zentrale Summenberechnung ---
function calculateTotal(drinks) {
    // Wenn kein Array übergeben wird, ist die Summe 0
    if (!Array.isArray(drinks)) return 0;
    
    return drinks.reduce((sum, item) => {
        // Sicherstellen, dass der Preis eine gültige Zahl ist
        const price = Number(item.price);
        if (isNaN(price)) return sum; 
        
        return sum + price;
    }, 0);
}

// --- Persistenz-Hilfsfunktionen (abgesichert) ---
function loadState() {
    try {
        const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            if (Array.isArray(parsedData.consumedDrinks)) {
                const validDrinks = parsedData.consumedDrinks.filter(item => {
                    return item 
                        && typeof item.id === 'string' 
                        && typeof item.price === 'number' 
                        && !isNaN(item.price);
                });
                
                state.consumedDrinks = validDrinks;
                state.currentTotal = calculateTotal(state.consumedDrinks);
                
                if (validDrinks.length !== parsedData.consumedDrinks.length) {
                    saveState();
                }
            } else {
                throw new Error("Gespeicherte Datenstruktur ist kein Array");
            }
        }
    } catch (error) {
        console.warn("Defekte lokale Daten gefunden, starte sauber neu:", error);
        state.consumedDrinks = [];
        state.currentTotal = 0;
        saveState(); 
    }
}

function saveState() {
    try {
        const dataToSave = { consumedDrinks: state.consumedDrinks };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error("Fehler beim Speichern der Daten:", error);
    }
}

function formatCurrency(amount) {
    return `${amount.toFixed(2).replace('.', ',')} ${CONFIG.CURRENCY}`;
}

function getCategoryIcon(category) {
    const icons = {
        'Sprizz': '🍹',
        'Bier vom Fass': '🍺',
        'Flaschenbier': '🍺',
        'Cocktail': '🍸',
        'Kaffee': '☕',
        'Softdrink': '🥤',
        'Wasser': '💧',
        'Wein - WEISS': '🥂',
        'Wein - ROT': '🍷',
        'Säfte. Nektar & Schorlen': '🧃'
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
    
    elements.undoBtn = document.getElementById('undo-btn');
    elements.undoBtn.addEventListener('click', undoLastDrink);

    elements.resetBtn = document.getElementById('reset-btn');
    elements.resetBtn.addEventListener('click', resetDay);

    renderFavorites();
    renderDrinkList();
    updateUI();
}

// --- Modifizierte Hauptfunktionen ---
function addDrink(drink) {
    state.consumedDrinks.push({
        id: drink.id,
        price: drink.price,
        timestamp: new Date().toISOString()
    });
    
    state.currentTotal = calculateTotal(state.consumedDrinks);
    
    saveState();
    updateUI();
}

function undoLastDrink() {
    if (state.consumedDrinks.length === 0) return;
    
    state.consumedDrinks.pop();
    
    state.currentTotal = calculateTotal(state.consumedDrinks);
    
    saveState();
    updateUI();
}

function resetDay() {
    if (state.consumedDrinks.length === 0) return;
    
    const userConfirmed = confirm("Möchtest du wirklich einen neuen Tag starten?\nDie bisherigen Getränke von heute werden gelöscht.");
    
    if (userConfirmed) {
        state.consumedDrinks = [];
        state.currentTotal = 0; 
        
        saveState();
        updateUI();
    }
}

function renderFavorites() {
    elements.favGrid.innerHTML = ''; 
    
    favorites.forEach(drink => {
        const btn = document.createElement('button');
        btn.className = 'fav-btn';
        btn.innerHTML = `
            <span class="icon">${getCategoryIcon(drink.category)}</span>
            <span>${drink.name}</span>
            <small>${formatCurrency(drink.price)}</small>
        `;
        
        btn.addEventListener('click', () => addDrink(drink));
        
        elements.favGrid.appendChild(btn);
    });
}

function renderDrinkList() {
    elements.drinkList.innerHTML = ''; 
    
    drinksData.forEach(drink => {
        const li = document.createElement('li');
        li.className = 'list-item';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'drink-info';
        infoDiv.innerHTML = `
            <span class="drink-icon">${getCategoryIcon(drink.category)}</span>
            <div class="drink-text">
                <span class="drink-name">${drink.name}</span>
                <span class="drink-price">${formatCurrency(drink.price)}</span>
            </div>
        `;
        
        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.textContent = '+';
        // NEU ZIEL 1 & 2: Sauberes Event-Binding + Übergabe des Objekts
        addBtn.addEventListener('click', () => addDrink(drink));
        
        // Elemente zur Liste hinzufügen
        li.appendChild(infoDiv);
        li.appendChild(addBtn);
        elements.drinkList.appendChild(li);
    });
}

function updateUI() {
    // NEU ZIEL 3: Zugriff über das elements-Objekt (kein getElementById mehr nötig)
    elements.totalAmount.textContent = formatCurrency(state.currentTotal);

    let percentage = (state.currentTotal / CONFIG.DAILY_GOAL) * 100;
    if (percentage > 100) percentage = 100;
    elements.progressBar.style.width = `${percentage}%`;

    elements.statusLight.classList.remove('light-red', 'light-yellow', 'light-green');
    
    if (state.currentTotal === 0) {
        elements.statusLight.classList.add('light-red');
        elements.progressBar.style.backgroundColor = 'var(--system-red)';
    } else if (state.currentTotal < CONFIG.DAILY_GOAL) {
        elements.statusLight.classList.add('light-yellow');
        elements.progressBar.style.backgroundColor = 'var(--system-yellow)';
    } else {
        elements.statusLight.classList.add('light-green');
        elements.progressBar.style.backgroundColor = 'var(--system-green)';
    }

    // NEU: Undo-Button deaktivieren, wenn keine Getränke gespeichert sind
    elements.undoBtn.disabled = (state.consumedDrinks.length === 0);
    // NEU: Reset-Button ebenfalls deaktivieren, wenn alles leer ist
    elements.resetBtn.disabled = (state.consumedDrinks.length === 0);
}

// Start der App
init();