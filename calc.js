// Rechenkern des Drink Trackers.
// Reine Funktionen ohne DOM und ohne globalen Zustand: Alle Werte kommen als
// Parameter. Die Datei läuft unverändert im Browser (globales `DrinkCalc`) und
// in Node (`require('./calc.js')`), damit dieselbe Logik getestet und später
// auch serverseitig genutzt werden kann.
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.DrinkCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const PACKAGE_TYPES = { ALL_INCLUSIVE: 'ai', FUN: 'fun' };
    const CSV_COLUMNS = ['ID', 'Name', 'Typ', 'Preis NEU', 'Alkoholfrei', 'AI', 'F'];
    const WARNING_THRESHOLD = 0.75;

    function toAmount(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    // Kaufmännisch auf Cent runden; verhindert Fließkomma-Reste wie 0.30000000000000004.
    function roundMoney(value) {
        return Math.round((toAmount(value) + Number.EPSILON) * 100) / 100;
    }

    // Division, die nie durch 0 teilt: ohne positiven Nenner ist das Ergebnis 0.
    function safeRatio(part, whole) {
        const divisor = toAmount(whole);
        if (divisor <= 0) return 0;
        return toAmount(part) / divisor;
    }

    // Macht Text aus fremden Quellen (gescannte QR-Codes, importierte Daten) für
    // die Ausgabe in HTML unschädlich.
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    }

    function formatMoney(amount, currency = '€') {
        return `${roundMoney(amount).toFixed(2).replace('.', ',')} ${currency}`;
    }

    // Tagesziel = Paketpreis / Reisetage, auf Cent gerundet.
    // Für die Gesamtbilanz zählt der Paketpreis selbst, nicht Tagesziel × Tage.
    function dailyGoal(packagePrice, duration) {
        return roundMoney(safeRatio(packagePrice, duration));
    }

    // Ein Getränk ist im Paket enthalten oder nicht – es gibt keinen Teil-Aufschlag.
    function isIncluded(drink, packageType = PACKAGE_TYPES.ALL_INCLUSIVE) {
        if (!drink) return false;
        return packageType === PACKAGE_TYPES.FUN ? drink.isF === true : drink.isAI === true;
    }

    function sumPrices(drinks) {
        return roundMoney(drinks.reduce((sum, drink) => sum + toAmount(drink.price), 0));
    }

    // Wert der Getränke, die zum Paket zählen.
    function sumIncluded(drinks, packageType) {
        if (!Array.isArray(drinks)) return 0;
        return sumPrices(drinks.filter((drink) => isIncluded(drink, packageType)));
    }

    // Zuzahlung: Getränke außerhalb des Pakets, mit vollem Preis.
    function sumExtra(drinks, packageType) {
        if (!Array.isArray(drinks)) return 0;
        return sumPrices(drinks.filter((drink) => !isIncluded(drink, packageType)));
    }

    // Fortschritt gegen ein Ziel (Tagesziel oder Paketpreis).
    // status: 'error' unter 75 %, 'warning' unter 100 %, sonst 'safe'.
    function progress(spent, limit) {
        const spentAmount = toAmount(spent);
        const limitAmount = toAmount(limit);
        const ratio = Math.min(Math.max(safeRatio(spentAmount, limitAmount), 0), 1);

        let status = 'safe';
        if (limitAmount <= 0 || spentAmount < limitAmount * WARNING_THRESHOLD) status = 'error';
        else if (spentAmount < limitAmount) status = 'warning';

        return {
            ratio,
            percent: Math.round(ratio * 100),
            remaining: roundMoney(Math.max(limitAmount - spentAmount, 0)),
            status,
        };
    }

    // Alte Einträge nutzten die CSV-Zeilennummer als ID (`csv-0` = erste Zeile).
    // Die stabilen IDs wurden in genau dieser Reihenfolge vergeben.
    function migrateDrinkId(id) {
        const match = /^csv-(\d+)$/.exec(String(id));
        if (!match) return String(id);
        return `G${String(Number(match[1]) + 1).padStart(4, '0')}`;
    }

    function normalizeDay(dayData, fallbackDayNumber = 1, packageType, now = new Date().toISOString()) {
        const source = dayData || {};
        const drinks = Array.isArray(source.drinks)
            ? source.drinks.filter(Boolean).map((drink) => ({
                  id: migrateDrinkId(drink.id || 'unknown'),
                  name: String(drink.name || 'Unbekanntes Getränk'),
                  category: drink.category || 'Sonstiges',
                  price: toAmount(drink.price),
                  isNonAlcoholic: drink.isNonAlcoholic === true,
                  isAI: drink.isAI === true,
                  isF: drink.isF === true,
                  timestamp: drink.timestamp || now,
              }))
            : [];

        return {
            day: Number(source.day) || fallbackDayNumber,
            date: source.date || now,
            drinks,
            total: sumIncluded(drinks, packageType),
            totalExtra: sumExtra(drinks, packageType),
        };
    }

    // Summen über alle Reisetage. Gerechnet wird aus den Getränken, nicht aus
    // gespeicherten Tagessummen.
    function aggregateStats(days, packageType) {
        const stats = { grandTotal: 0, grandTotalExtra: 0, totalDrinks: 0, byDrink: {} };

        (Array.isArray(days) ? days : []).filter(Boolean).forEach((day) => {
            const drinks = Array.isArray(day.drinks) ? day.drinks : [];
            stats.grandTotal += sumIncluded(drinks, packageType);
            stats.grandTotalExtra += sumExtra(drinks, packageType);
            stats.totalDrinks += drinks.length;

            drinks.forEach((drink) => {
                if (!stats.byDrink[drink.id]) {
                    stats.byDrink[drink.id] = {
                        id: drink.id,
                        latestName: drink.name,
                        category: drink.category,
                        count: 0,
                        totalSpent: 0,
                    };
                }
                stats.byDrink[drink.id].count += 1;
                stats.byDrink[drink.id].totalSpent = roundMoney(stats.byDrink[drink.id].totalSpent + toAmount(drink.price));
            });
        });

        stats.grandTotal = roundMoney(stats.grandTotal);
        stats.grandTotalExtra = roundMoney(stats.grandTotalExtra);
        return stats;
    }

    // Liest die Getränke-CSV (Semikolon-getrennt, optional mit BOM). Spalten
    // werden über den Kopf gefunden, nicht über ihre Position.
    function parseDrinksCsv(csvText) {
        const lines = String(csvText || '')
            .replace(/^﻿/, '')
            .split(/\r?\n/)
            .filter((line) => line.trim() !== '');
        if (lines.length === 0) return [];

        const header = lines[0].split(';').map((name) => name.trim());
        const column = Object.fromEntries(CSV_COLUMNS.map((name) => [name, header.indexOf(name)]));

        return lines.slice(1).map((line, index) => {
            const cols = line.split(';');
            const get = (name) => (column[name] >= 0 ? (cols[column[name]] || '').trim() : '');
            const price = parseFloat(get('Preis NEU').replace(',', '.'));

            return {
                id: get('ID') || migrateDrinkId(`csv-${index}`),
                name: get('Name') || 'Unbekannt',
                category: get('Typ') || 'Sonstiges',
                price: Number.isFinite(price) ? price : 0,
                isNonAlcoholic: get('Alkoholfrei') === 'Ja',
                isAI: get('AI') === 'Ja',
                isF: get('F') === 'Ja',
            };
        });
    }

    return {
        PACKAGE_TYPES,
        CSV_COLUMNS,
        roundMoney,
        safeRatio,
        formatMoney,
        escapeHtml,
        dailyGoal,
        isIncluded,
        sumIncluded,
        sumExtra,
        progress,
        migrateDrinkId,
        normalizeDay,
        aggregateStats,
        parseDrinksCsv,
    };
});
