// --- Konfiguration ---
const CONFIG = {
    DAILY_GOAL: 26.67,
    CURRENCY: '€'
};

// --- App State (Zustand) ---
let state = {
    currentTotal: 0
};

// NEU ZIEL 3: Zentrales Objekt für DOM-Referenzen
const elements = {};

// --- Beispieldaten ---
const drinksData = [
    { id: 'd1', name: "APEROL SPRIZZ", category: "Sprizz", price: 9.20, isNonAlcoholic: false, isAI: true },
    { id: 'd2', name: "RADEBERGER 0,5 l", category: "Bier vom Fass", price: 5.50, isNonAlcoholic: false, isAI: true },
    { id: 'd3', name: "MOJITO", category: "Cocktail", price: 9.20, isNonAlcoholic: false, isAI: true },
    { id: 'd4', name: "CAPPUCCINO", category: "Kaffee", price: 4.10, isNonAlcoholic: true, isAI: true },
    { id: 'd5', name: "COCA-COLA 0,2 l", category: "Softdrink", price: 2.60, isNonAlcoholic: true, isAI: true }
];

const favorites = drinksData.slice(0, 4);

// --- Hilfsfunktionen ---
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

// --- Hauptfunktionen ---
function init() {
    // NEU ZIEL 3: Einmaliges Sammeln der DOM-Elemente beim Start
    elements.favGrid = document.getElementById('fav-grid');
    elements.drinkList = document.getElementById('drink-list');
    elements.totalAmount = document.getElementById('total-amount');
    elements.statusLight = document.getElementById('status-light');
    elements.progressBar = document.getElementById('progress-bar');

    renderFavorites();
    renderDrinkList();
    updateUI();
}

// NEU ZIEL 2: Nimmt nun das gesamte Getränke-Objekt entgegen
function addDrink(drink) {
    state.currentTotal += drink.price;
    
    // Vorbereitung für später:
    // z.B. state.history.push({ id: drink.id, time: new Date() })
    
    updateUI();
}

// --- Render-Funktionen ---
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
        
        // NEU ZIEL 1 & 2: Sauberes Event-Binding + Übergabe des Objekts
        btn.addEventListener('click', () => addDrink(drink));
        
        elements.favGrid.appendChild(btn);
    });
}

function renderDrinkList() {
    elements.drinkList.innerHTML = ''; 
    
    drinksData.forEach(drink => {
        const li = document.createElement('li');
        li.className = 'list-item';
        
        // NEU ZIEL 1: Um Event-Listener nutzen zu können, bauen wir die 
        // HTML-Elemente für das Info-Div und den Button getrennt voneinander auf.
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
}

// Start der App
init();