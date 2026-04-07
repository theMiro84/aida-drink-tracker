const CONFIG = {
    DAILY_GOAL: 26.67,
    CURRENCY: '€',
    STORAGE_KEY: 'aida_drink_tracker_v1' 
};

function createNewDay(dayNumber) {
    return {
        day: dayNumber,
        date: new Date().toISOString(),
        drinks: [],
        total: 0
    };
}

let state = {
    currentDay: createNewDay(1),
    archive: [] 
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

function calculateTotal(drinks) {
    if (!Array.isArray(drinks)) return 0;
    
    return drinks.reduce((sum, item) => {
        const price = Number(item.price);
        if (isNaN(price)) return sum; 
        
        return sum + price;
    }, 0);
}

function loadState() {
    try {
        const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            state.archive = Array.isArray(parsedData.archive) ? parsedData.archive : [];
            
            if (parsedData.currentDay) {
                state.currentDay = parsedData.currentDay;
                state.currentDay.total = calculateTotal(state.currentDay.drinks);
            } else if (parsedData.consumedDrinks) {
                const oldDayNumber = parsedData.dayCounter || 1;
                state.currentDay = createNewDay(oldDayNumber);
                
                const validDrinks = parsedData.consumedDrinks.filter(item => {
                    return item && typeof item.id === 'string' && typeof item.price === 'number' && !isNaN(item.price);
                });
                
                state.currentDay.drinks = validDrinks;
                state.currentDay.total = calculateTotal(state.currentDay.drinks);
                
                saveState();
            }
        }
    } catch (error) {
        console.warn("Defekte lokale Daten gefunden, starte sauber neu:", error);
        state.currentDay = createNewDay(1);
        state.archive = [];
        saveState(); 
    }
}

function saveState() {
    try {
        const dataToSave = { 
            currentDay: state.currentDay,
            archive: state.archive
        };
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

    elements.nextDayBtn = document.getElementById('next-day-btn');
    elements.nextDayBtn.addEventListener('click', startNewDay);

    elements.dayLabel = document.getElementById('day-label');

    elements.historyList = document.getElementById('history-list');

    renderFavorites();
    renderDrinkList();
    updateUI();
}

function addDrink(drink) {
    state.currentDay.drinks.push({
        id: drink.id,
        name: drink.name, 
        price: drink.price,
        timestamp: new Date().toISOString()
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

// NEU: Tag abschließen und ins Archiv schieben
function startNewDay() {
    if (state.currentDay.drinks.length === 0) {
        alert("Dieser Tag enthält noch keine Getränke.");
        return;
    }
    
    const userConfirmed = confirm(`Möchtest du Tag ${state.currentDay.day} wirklich abschließen?\nEin neuer, leerer Tag wird gestartet.`);
    
    if (userConfirmed) {

        state.archive.push(JSON.parse(JSON.stringify(state.currentDay)));

        state.currentDay = createNewDay(state.currentDay.day + 1);
        
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
        addBtn.addEventListener('click', () => addDrink(drink));
        
        li.appendChild(infoDiv);
        li.appendChild(addBtn);
        elements.drinkList.appendChild(li);
    });
}

function renderHistory() {
    elements.historyList.innerHTML = '';
   
    if (state.currentDay.drinks.length === 0) {
        elements.historyList.innerHTML = '<li class="history-empty">Noch keine Getränke erfasst.</li>';
        return;
    }

    const recentDrinks = state.currentDay.drinks.slice(-3).reverse();

    recentDrinks.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const displayName = entry.name || 'Unbekanntes Getränk';
        const displayPrice = (typeof entry.price === 'number' && !isNaN(entry.price)) 
            ? formatCurrency(entry.price) 
            : '0,00 €';
        
        if (index === 0) {
            li.classList.add('newest');
            li.innerHTML = `
                <div class="history-item-main">
                    <small class="undo-hint">Zuletzt hinzugefügt</small>
                    <span>${displayName}</span>
                </div>
                <span>${displayPrice}</span>
            `;
        } else {
            li.innerHTML = `
                <span>${displayName}</span>
                <span>${displayPrice}</span>
            `;
        }
        
        elements.historyList.appendChild(li);
    });
}

function updateUI() {

    if (elements.dayLabel) {
        elements.dayLabel.textContent = `Tag ${state.currentDay.day}`;
    }
    
    elements.totalAmount.textContent = formatCurrency(state.currentDay.total);

    let percentage = (state.currentDay.total / CONFIG.DAILY_GOAL) * 100; 
    if (percentage > 100) percentage = 100;
    elements.progressBar.style.width = `${percentage}%`;

    elements.statusLight.classList.remove('light-red', 'light-yellow', 'light-green');
    
    if (state.currentDay.total === 0) { 
        elements.statusLight.classList.add('light-red');
        elements.progressBar.style.backgroundColor = 'var(--system-red)';
    } else if (state.currentDay.total < CONFIG.DAILY_GOAL) {
        elements.statusLight.classList.add('light-yellow');
        elements.progressBar.style.backgroundColor = 'var(--system-yellow)';
    } else {
        elements.statusLight.classList.add('light-green');
        elements.progressBar.style.backgroundColor = 'var(--system-green)';
    }
    
    elements.undoBtn.disabled = (state.currentDay.drinks.length === 0); 
    
    renderHistory();
}

init();