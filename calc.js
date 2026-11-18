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

    // Ring im Stil der Aktivitätsringe: läuft über 100 % hinaus.
    // percent und angle sind ungedeckelt; angle ist der absolute Winkel
    // (Verhältnis × 360°, auf 0,01° gerundet). Ungültige Eingaben ergeben 0.
    function ringProgress(spent, limit) {
        const ratio = Math.max(safeRatio(spent, limit), 0);
        return {
            percent: Math.round(ratio * 100),
            angle: Math.round(ratio * 360 * 100) / 100,
        };
    }

    // Alte Einträge nutzten die CSV-Zeilennummer als ID (`csv-0` = erste Zeile).
    // Die stabilen IDs wurden in genau dieser Reihenfolge vergeben.
    function migrateDrinkId(id) {
        const match = /^csv-(\d+)$/.exec(String(id));
        if (!match) return String(id);
        return `G${String(Number(match[1]) + 1).padStart(4, '0')}`;
    }

    // Text aus gespeicherten oder importierten Daten: nur echte, nicht leere
    // Zeichenketten (IDs auch als Zahl) zählen, alles andere wird ersetzt.
    function textOr(value, fallback) {
        return typeof value === 'string' && value !== '' ? value : fallback;
    }

    function normalizeDay(dayData, fallbackDayNumber = 1, packageType, now = new Date().toISOString()) {
        const source = dayData || {};
        const drinks = Array.isArray(source.drinks)
            ? source.drinks.filter(Boolean).map((drink) => ({
                  id: migrateDrinkId(textOr(typeof drink.id === 'number' ? String(drink.id) : drink.id, 'unknown')),
                  name: textOr(drink.name, 'Unbekanntes Getränk'),
                  category: textOr(drink.category, 'Sonstiges'),
                  price: toAmount(drink.price),
                  isNonAlcoholic: drink.isNonAlcoholic === true,
                  isAI: drink.isAI === true,
                  isF: drink.isF === true,
                  timestamp: textOr(drink.timestamp, now),
              }))
            : [];

        return {
            day: Number(source.day) || fallbackDayNumber,
            date: textOr(source.date, now),
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

    // --- Datensicherung ---
    // Eine Sicherung ist eine JSON-Datei mit Kennung, Formatversion und dem
    // vollständigen Zustand der App. Die Version steigt nur, wenn sich der
    // Aufbau so ändert, dass ältere App-Versionen ihn nicht mehr lesen können.
    const BACKUP_FORMAT = 'drink-tracker-backup';
    const BACKUP_VERSION = 1;
    const PROFILE_DEFAULTS = { name: 'Gast', nickname: 'Gaston', duration: 9, packagePrice: 240 };

    function isPlainObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    // Reisetage sind ganze Zahlen ab 1, der Paketpreis ist größer als 0;
    // alles andere fällt auf den Standardwert zurück.
    function normalizeProfile(profile, defaults = PROFILE_DEFAULTS) {
        const source = isPlainObject(profile) ? profile : {};
        const duration = Number(source.duration);
        const packagePrice = Number(source.packagePrice);
        return {
            name: String(source.name || defaults.name),
            nickname: String(source.nickname || defaults.nickname),
            duration: Number.isInteger(duration) && duration >= 1 ? duration : defaults.duration,
            packagePrice: Number.isFinite(packagePrice) && packagePrice > 0 ? packagePrice : defaults.packagePrice,
        };
    }

    function normalizeCompanions(companions, now = new Date().toISOString()) {
        if (!Array.isArray(companions)) return [];
        return companions
            .filter((companion) => isPlainObject(companion) && String(companion.nickname ?? '').trim() !== '')
            .map((companion) => ({
                nickname: String(companion.nickname),
                limit: toAmount(companion.limit),
                spent: toAmount(companion.spent),
                extra: toAmount(companion.extra),
                lastUpdate: typeof companion.lastUpdate === 'string' ? companion.lastUpdate : now,
            }));
    }

    // Bringt einen kompletten Zustand (aus einer Sicherung) in die aktuelle Form.
    // Summen werden aus den Getränken neu berechnet, unbekannte Felder entfallen.
    function normalizeState(raw, packageType, now = new Date().toISOString()) {
        const source = isPlainObject(raw) ? raw : {};
        const archive = Array.isArray(source.archive)
            ? source.archive.filter(isPlainObject).map((day, index) => normalizeDay(day, index + 1, packageType, now))
            : [];
        return {
            profile: normalizeProfile(source.profile),
            currentDay: normalizeDay(isPlainObject(source.currentDay) ? source.currentDay : null, archive.length + 1, packageType, now),
            archive,
            companions: normalizeCompanions(source.companions, now),
        };
    }

    // Kennzahlen für Rückfragen und Meldungen ("3 Reisetage, 12 Getränke").
    function backupSummary(state) {
        const source = isPlainObject(state) ? state : {};
        const days = [...(Array.isArray(source.archive) ? source.archive : []), source.currentDay].filter(Boolean);
        return { days: days.length, drinks: aggregateStats(days).totalDrinks };
    }

    function createBackup(state, now = new Date().toISOString()) {
        return {
            format: BACKUP_FORMAT,
            version: BACKUP_VERSION,
            createdAt: now,
            data: normalizeState(state, undefined, now),
        };
    }

    // Dateiname mit lokalem Datum und Uhrzeit, z. B. drink-tracker-sicherung-2027-01-14-0930.json
    function backupFileName(date = new Date()) {
        const pad = (number) => String(number).padStart(2, '0');
        const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        return `drink-tracker-sicherung-${day}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
    }

    // Prüft den Text einer Sicherungsdatei. Ergebnis: { ok: true, state, createdAt,
    // summary } oder { ok: false, error } mit einer Meldung für die Anzeige.
    // Wirft nie; eine fremde oder beschädigte Datei verändert nichts.
    function parseBackup(text, now = new Date().toISOString()) {
        const fail = (error) => ({ ok: false, error });

        let parsed;
        try {
            parsed = JSON.parse(String(text ?? '').replace(/^﻿/, ''));
        } catch (error) {
            return fail('Die Datei ist keine lesbare Sicherung (kein gültiges JSON).');
        }

        if (!isPlainObject(parsed) || parsed.format !== BACKUP_FORMAT) {
            return fail('Die Datei ist keine Sicherung des Drink Trackers.');
        }
        if (!Number.isInteger(parsed.version) || parsed.version < 1) {
            return fail('Die Sicherung hat keine gültige Formatversion.');
        }
        if (parsed.version > BACKUP_VERSION) {
            return fail('Die Sicherung stammt aus einer neueren App-Version. Bitte die App zuerst aktualisieren.');
        }

        const data = parsed.data;
        if (!isPlainObject(data) || !isPlainObject(data.profile) || !isPlainObject(data.currentDay) || !Array.isArray(data.archive)) {
            return fail('Die Sicherung ist unvollständig (Profil, aktueller Tag oder Archiv fehlen).');
        }

        const state = normalizeState(data, undefined, now);
        return {
            ok: true,
            state,
            createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : null,
            summary: backupSummary(state),
        };
    }

    return {
        PACKAGE_TYPES,
        CSV_COLUMNS,
        BACKUP_FORMAT,
        BACKUP_VERSION,
        normalizeProfile,
        normalizeState,
        backupSummary,
        createBackup,
        backupFileName,
        parseBackup,
        roundMoney,
        safeRatio,
        formatMoney,
        escapeHtml,
        dailyGoal,
        isIncluded,
        sumIncluded,
        sumExtra,
        progress,
        ringProgress,
        migrateDrinkId,
        normalizeDay,
        aggregateStats,
        parseDrinksCsv,
    };
});
