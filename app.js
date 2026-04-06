// Konfiguration
const DAILY_GOAL = 26.67;
let currentTotal = 0;

// Beispieldaten (später aus CSV)
const drinks = [
    { name: "APEROL SPRIZZ", price: 9.20, category: "Sprizz" },
    { name: "RADEBERGER 0,5 l", price: 5.50, category: "Bier" },
    { name: "MOJITO", price: 9.20, category: "Cocktail" },
    { name: "CAPPUCCINO", price: 4.10, category: "Kaffee" },
    { name: "COCA-COLA 0,2 l", price: 2.60, category: "Softdrink" }
];

// Favoriten-Auswahl (die ersten 4)
const favorites = drinks.slice(0, 4);

function init() {
    renderFavorites();
    renderDrinkList();
    updateUI();
}

function renderFavorites() {
    const container = document.getElementById('fav-grid');
    favorites.forEach(drink => {
        const btn = document.createElement('button');
        btn.className = 'fav-btn';
        btn.innerHTML = `${drink.name}<br><small>${drink.price.toFixed(2)} €</small>`;
        btn.onclick = () => addDrink(drink.price);
        container.appendChild(btn);
    });
}

function renderDrinkList() {
    const container = document.getElementById('drink-list');
    drinks.forEach(drink => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
            <div class="drink-info">
                <span class="drink-name">${drink.name}</span>
                <span class="drink-price">${drink.price.toFixed(2)} €</span>
            </div>
            <button class="add-btn" onclick="addDrink(${drink.price})">+</button>
        `;
        container.appendChild(li);
    });
}

function addDrink(price) {
    currentTotal += price;
    updateUI();
}

function updateUI() {
    const totalEl = document.getElementById('total-amount');
    const lightEl = document.getElementById('status-light');
    
    totalEl.textContent = `${currentTotal.toFixed(2).replace('.', ',')} €`;

    // Ampel-Logik
    lightEl.classList.remove('light-red', 'light-yellow', 'light-green');
    
    if (currentTotal === 0) {
        lightEl.classList.add('light-red');
    } else if (currentTotal < DAILY_GOAL) {
        lightEl.classList.add('light-yellow');
    } else {
        lightEl.classList.add('light-green');
    }
}

// Start der App
init();