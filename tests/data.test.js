const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const calc = require('../calc.js');

const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'getraenke.csv'), 'utf8');
const lines = raw.replace(/^﻿/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
const rows = lines.slice(1).map((line) => line.split(';'));
const drinks = calc.parseDrinksCsv(raw);

test('Getränke-CSV: Kopfzeile entspricht dem erwarteten Schema', () => {
    assert.deepEqual(lines[0].split(';'), calc.CSV_COLUMNS);
});

test('Getränke-CSV: jede Zeile hat alle Spalten', () => {
    rows.forEach((cols, index) => assert.equal(cols.length, calc.CSV_COLUMNS.length, `Zeile ${index + 2}`));
    assert.equal(drinks.length, rows.length);
    assert.ok(drinks.length > 0);
});

test('Getränke-CSV: IDs sind vorhanden, eindeutig und im Format G0001', () => {
    const ids = rows.map((cols) => cols[0]);
    ids.forEach((id, index) => assert.match(id, /^G\d{4}$/, `Zeile ${index + 2}`));
    assert.equal(new Set(ids).size, ids.length, 'doppelte ID');
});

test('Getränke-CSV: Name und Typ sind gefüllt, Preise sind positive Zahlen', () => {
    rows.forEach((cols, index) => {
        const where = `Zeile ${index + 2}`;
        assert.notEqual(cols[1].trim(), '', `${where}: Name fehlt`);
        assert.match(cols[1], /^[^|<>]*[^|<>\s]$/, `${where}: Name enthält Sonderzeichen oder endet auf Leerzeichen`);
        assert.notEqual(cols[2].trim(), '', `${where}: Typ fehlt`);
        assert.match(cols[3].trim(), /^\d+([.,]\d{1,2})?$/, `${where}: Preis`);
        assert.ok(drinks[index].price > 0, `${where}: Preis > 0`);
    });
});

test('Getränke-CSV: Kennzeichen sind "Ja" oder leer', () => {
    rows.forEach((cols, index) => {
        for (const position of [4, 5, 6]) {
            assert.ok(['Ja', ''].includes(cols[position].trim()), `Zeile ${index + 2}, Spalte ${calc.CSV_COLUMNS[position]}`);
        }
    });
});

test('Getränke-CSV: Fun-Getränke sind alkoholfrei und auch in All Inclusive enthalten', () => {
    drinks.filter((drink) => drink.isF).forEach((drink) => {
        assert.ok(drink.isNonAlcoholic, `${drink.id} ${drink.name}: Fun, aber nicht alkoholfrei`);
        assert.ok(drink.isAI, `${drink.id} ${drink.name}: Fun, aber nicht in All Inclusive`);
    });
});
