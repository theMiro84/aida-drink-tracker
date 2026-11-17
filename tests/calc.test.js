const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../calc.js');

const drink = (price, flags = {}) => ({ id: 'G0001', name: 'Test', category: 'Test', price, isAI: true, isF: false, ...flags });
const special = (price) => drink(price, { isAI: false });

test('Tagesziel: Paketpreis / Reisetage, auf Cent gerundet', () => {
    assert.equal(calc.dailyGoal(240, 9), 26.67);
    assert.equal(calc.dailyGoal(240, 8), 30);
    assert.equal(calc.dailyGoal(199.9, 7), 28.56);
    assert.equal(calc.dailyGoal(100, 3), 33.33);
});

test('Tagesziel: gilt für beliebige Reisen, nicht nur 9 Tage / 240 Euro', () => {
    for (const [price, days] of [[240, 9], [350, 14], [99, 4], [1, 365]]) {
        const goal = calc.dailyGoal(price, days);
        assert.ok(Math.abs(goal - price / days) <= 0.005, `${price} / ${days}`);
    }
});

test('Division durch 0: liefert 0 statt NaN oder Infinity', () => {
    for (const bad of [0, -3, NaN, undefined, null, 'abc', Infinity]) {
        assert.equal(calc.dailyGoal(240, bad), 0, `Reisetage ${bad}`);
        assert.equal(calc.safeRatio(10, bad), 0, `Nenner ${bad}`);
    }
    assert.equal(calc.dailyGoal(undefined, 9), 0);

    const noLimit = calc.progress(50, 0);
    assert.deepEqual(noLimit, { ratio: 0, percent: 0, remaining: 0, status: 'error' });
    assert.ok(Object.values(calc.progress(NaN, NaN)).every((v) => typeof v !== 'number' || Number.isFinite(v)));
});

test('Tagessumme: zählt nur Getränke aus dem Paket', () => {
    const drinks = [drink(5.5), drink(7.5), special(12.9), drink(6.5)];
    assert.equal(calc.sumIncluded(drinks), 19.5);
    assert.equal(calc.sumExtra(drinks), 12.9);
});

test('Sondergetränke: voller Preis als Zuzahlung, kein Beitrag zum Paket', () => {
    const drinks = [special(64.9), special(4.9)];
    assert.equal(calc.sumIncluded(drinks), 0);
    assert.equal(calc.sumExtra(drinks), 69.8);
    assert.equal(calc.progress(calc.sumIncluded(drinks), 26.67).percent, 0);
});

test('Summen: jedes Getränk zählt genau einmal (Paket + Zuzahlung = Gesamt)', () => {
    const drinks = [drink(5.5), special(4.9), drink(0.1), drink(0.2), special(149)];
    const all = calc.roundMoney(drinks.reduce((sum, d) => sum + d.price, 0));
    assert.equal(calc.roundMoney(calc.sumIncluded(drinks) + calc.sumExtra(drinks)), all);
});

test('Summen: keine Fließkomma-Reste', () => {
    assert.equal(calc.sumIncluded([drink(0.1), drink(0.2)]), 0.3);
    assert.equal(calc.sumIncluded(Array.from({ length: 10 }, () => drink(4.9))), 49);
});

test('Summen: leere und ungültige Eingaben ergeben 0', () => {
    assert.equal(calc.sumIncluded([]), 0);
    assert.equal(calc.sumExtra(undefined), 0);
    assert.equal(calc.sumIncluded([drink('abc'), drink(undefined)]), 0);
});

test('Paket-Typ: "fun" wertet die Spalte F aus, Standard ist All Inclusive', () => {
    const drinks = [drink(5.5, { isF: true }), drink(8.9), special(12)];
    assert.equal(calc.sumIncluded(drinks), 14.4);
    assert.equal(calc.sumIncluded(drinks, calc.PACKAGE_TYPES.ALL_INCLUSIVE), 14.4);
    assert.equal(calc.sumIncluded(drinks, calc.PACKAGE_TYPES.FUN), 5.5);
    assert.equal(calc.sumExtra(drinks, calc.PACKAGE_TYPES.FUN), 20.9);
});

test('Check gegen das Tagesziel: Ampel, Prozent und Restbetrag', () => {
    const goal = calc.dailyGoal(240, 9);
    assert.deepEqual(calc.progress(0, goal), { ratio: 0, percent: 0, remaining: 26.67, status: 'error' });
    assert.equal(calc.progress(20, goal).status, 'error');
    assert.equal(calc.progress(20.01, goal).status, 'warning');
    assert.equal(calc.progress(26.66, goal).status, 'warning');
    assert.equal(calc.progress(26.66, goal).remaining, 0.01);
    assert.deepEqual(calc.progress(26.67, goal), { ratio: 1, percent: 100, remaining: 0, status: 'safe' });
});

test('Check gegen das Ziel: Übererfüllung wird bei 100 % gedeckelt', () => {
    assert.deepEqual(calc.progress(500, 240), { ratio: 1, percent: 100, remaining: 0, status: 'safe' });
});

test('Ring über 100 %: ungedeckelter Prozentwert, erste und zweite Runde', () => {
    assert.deepEqual(calc.ringProgress(0, 20), { percent: 0, first: 0, second: 0 });
    assert.deepEqual(calc.ringProgress(10, 20), { percent: 50, first: 0.5, second: 0 });
    assert.deepEqual(calc.ringProgress(20, 20), { percent: 100, first: 1, second: 0 });
    const over = calc.ringProgress(46, 20);
    assert.equal(over.percent, 230);
    assert.deepEqual(over, { percent: 230, first: 1, second: 1 });
    assert.deepEqual(calc.ringProgress(30, 20), { percent: 150, first: 1, second: 0.5 });
    const barelyOver = calc.ringProgress(20.2, 20);
    assert.equal(barelyOver.percent, 101);
    assert.equal(barelyOver.first, 1);
    assert.ok(Math.abs(barelyOver.second - 0.01) < 1e-9, `second ${barelyOver.second}`);
    assert.deepEqual(calc.ringProgress(40, 20), { percent: 200, first: 1, second: 1 });
    assert.deepEqual(calc.ringProgress(500, 20), { percent: 2500, first: 1, second: 1 });
    // progress() bleibt gedeckelt
    assert.equal(calc.progress(46, 20).percent, 100);
});

test('Ring über 100 %: nie durch 0 teilen, ungültige Eingaben ergeben 0', () => {
    const empty = { percent: 0, first: 0, second: 0 };
    for (const limit of [0, -5, NaN, undefined, null, 'abc']) {
        assert.deepEqual(calc.ringProgress(46, limit), empty, `Limit ${limit}`);
    }
    for (const spent of [-10, NaN, undefined, null, 'abc']) {
        assert.deepEqual(calc.ringProgress(spent, 20), empty, `Betrag ${spent}`);
    }
});

test('Gesamtbilanz: der Paketpreis zählt, nicht die Summe der Tagesziele', () => {
    const goal = calc.dailyGoal(240, 9);
    assert.equal(calc.roundMoney(goal * 9), 240.03);

    // 9 Tage knapp unter dem gerundeten Tagesziel ergeben 239,94 € – das Paket ist nicht erreicht.
    assert.equal(calc.progress(calc.roundMoney(26.66 * 9), 240).status, 'warning');
    // Exakt der Paketpreis reicht, auch wenn 9 × Tagesziel 3 Cent darüber läge.
    assert.deepEqual(calc.progress(240, 240), { ratio: 1, percent: 100, remaining: 0, status: 'safe' });
    assert.equal(calc.progress(239.99, 240).remaining, 0.01);
});

test('Gesamtbeträge: Summe über alle Tage, Sondergetränke getrennt', () => {
    const days = [
        { day: 1, drinks: [drink(5.5), drink(7.5), special(12.9)] },
        { day: 2, drinks: [drink(6.5), special(4.9)] },
        { day: 3, drinks: [] },
        null,
    ];
    const stats = calc.aggregateStats(days);
    assert.equal(stats.grandTotal, 19.5);
    assert.equal(stats.grandTotalExtra, 17.8);
    assert.equal(stats.totalDrinks, 5);
});

test('Gesamtbeträge: Gesamtsumme entspricht der Summe der Tagessummen', () => {
    const days = [
        calc.normalizeDay({ day: 1, drinks: [drink(0.1), drink(0.2), special(1.1)] }),
        calc.normalizeDay({ day: 2, drinks: [drink(4.9), drink(4.9), drink(4.9)] }),
    ];
    const stats = calc.aggregateStats(days);
    assert.equal(stats.grandTotal, calc.roundMoney(days[0].total + days[1].total));
    assert.equal(stats.grandTotalExtra, calc.roundMoney(days[0].totalExtra + days[1].totalExtra));
    assert.equal(stats.grandTotal, 15);
});

test('Gesamtbeträge: gespeicherte Tagessummen werden nicht blind übernommen', () => {
    const stats = calc.aggregateStats([{ day: 1, total: 999, totalExtra: 999, drinks: [drink(5)] }]);
    assert.equal(stats.grandTotal, 5);
    assert.equal(stats.grandTotalExtra, 0);
});

test('Statistik pro Getränk: Anzahl und Ausgaben je ID', () => {
    const a = (price) => drink(price, { id: 'G0001', name: 'A' });
    const b = drink(3, { id: 'G0002', name: 'B', isAI: false });
    const stats = calc.aggregateStats([{ drinks: [a(0.1), b] }, { drinks: [a(0.2)] }]);
    assert.equal(stats.byDrink.G0001.count, 2);
    assert.equal(stats.byDrink.G0001.totalSpent, 0.3);
    assert.equal(stats.byDrink.G0002.count, 1);
    assert.deepEqual(stats.grandTotal + stats.grandTotalExtra, 3.3);
});

test('Tag normalisieren: berechnet Summen neu und füllt Lücken', () => {
    const day = calc.normalizeDay(
        { day: '2', total: 999, drinks: [{ id: 'G0005', name: 'X', price: '5.5', isAI: true }, { price: 4 }, null] },
        7,
        undefined,
        '2026-01-01T00:00:00.000Z'
    );
    assert.equal(day.day, 2);
    assert.equal(day.total, 5.5);
    assert.equal(day.totalExtra, 4);
    assert.equal(day.drinks.length, 2);
    assert.deepEqual(day.drinks[1], {
        id: 'unknown',
        name: 'Unbekanntes Getränk',
        category: 'Sonstiges',
        price: 4,
        isNonAlcoholic: false,
        isAI: false,
        isF: false,
        timestamp: '2026-01-01T00:00:00.000Z',
    });
    assert.equal(calc.normalizeDay(undefined, 7).day, 7);
    assert.deepEqual(calc.normalizeDay(null).drinks, []);
});

test('IDs: alte Zeilennummern-IDs werden auf stabile IDs umgestellt', () => {
    assert.equal(calc.migrateDrinkId('csv-0'), 'G0001');
    assert.equal(calc.migrateDrinkId('csv-230'), 'G0231');
    assert.equal(calc.migrateDrinkId('G0042'), 'G0042');
    assert.equal(calc.migrateDrinkId('custom'), 'custom');
    assert.equal(calc.normalizeDay({ drinks: [{ id: 'csv-12', name: 'Alt', price: 1 }] }).drinks[0].id, 'G0013');
});

test('Formatierung: deutsches Dezimalkomma, zwei Nachkommastellen', () => {
    assert.equal(calc.formatMoney(26.666666), '26,67 €');
    assert.equal(calc.formatMoney(240), '240,00 €');
    assert.equal(calc.formatMoney(NaN), '0,00 €');
});

test('HTML-Ausgabe: fremder Text wird unschädlich gemacht', () => {
    assert.equal(calc.escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.equal(calc.escapeHtml("Tom & Jerry's"), 'Tom &amp; Jerry&#39;s');
    assert.equal(calc.escapeHtml('Jürgen Müßig'), 'Jürgen Müßig');
    assert.equal(calc.escapeHtml(undefined), '');
    assert.equal(calc.escapeHtml(42), '42');
});

test('CSV-Parser: liest Spalten über den Kopf, mit BOM, CRLF und Dezimalkomma', () => {
    const csv = '﻿ID;Name;Typ;Preis NEU;Alkoholfrei;AI;F\r\nG0001;COLA;Soft;3,5;Ja;Ja;Ja\r\nG0002; OUZO ;Anises;4.9;;;\r\n\r\n';
    assert.deepEqual(calc.parseDrinksCsv(csv), [
        { id: 'G0001', name: 'COLA', category: 'Soft', price: 3.5, isNonAlcoholic: true, isAI: true, isF: true },
        { id: 'G0002', name: 'OUZO', category: 'Anises', price: 4.9, isNonAlcoholic: false, isAI: false, isF: false },
    ]);
});

test('CSV-Parser: Spaltenreihenfolge ist egal, fehlende ID fällt auf die Zeilennummer zurück', () => {
    const csv = 'Preis NEU;Name;AI\n2;A;Ja\nxyz;B;\n';
    const drinks = calc.parseDrinksCsv(csv);
    assert.deepEqual(drinks.map((d) => [d.id, d.name, d.price, d.isAI]), [
        ['G0001', 'A', 2, true],
        ['G0002', 'B', 0, false],
    ]);
    assert.deepEqual(calc.parseDrinksCsv(''), []);
});
