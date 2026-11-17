const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../calc.js');

const NOW = '2027-01-14T09:30:00.000Z';

const drink = (price, flags = {}) => ({
    id: 'G0001',
    name: 'Test',
    category: 'Test',
    price,
    isNonAlcoholic: false,
    isAI: true,
    isF: false,
    timestamp: '2027-01-12T18:00:00.000Z',
    ...flags,
});

const sampleState = () => ({
    profile: { name: 'Mirco', nickname: 'Miro', duration: 9, packagePrice: 240 },
    archive: [
        { day: 1, date: '2027-01-12T08:00:00.000Z', drinks: [drink(5.5), drink(4.9, { id: 'G0013', isAI: false })], total: 5.5, totalExtra: 4.9 },
    ],
    currentDay: { day: 2, date: '2027-01-13T08:00:00.000Z', drinks: [drink(3)], total: 3, totalExtra: 0 },
    companions: [{ nickname: 'Anna', limit: 240, spent: 12.5, extra: 0, lastUpdate: '2027-01-13T10:00:00.000Z' }],
});

const fileText = (overrides = {}) => JSON.stringify({ ...calc.createBackup(sampleState(), NOW), ...overrides });

test('Sicherung: enthält Kennung, Formatversion, Zeitpunkt und den vollständigen Zustand', () => {
    const backup = calc.createBackup(sampleState(), NOW);
    assert.equal(backup.format, 'drink-tracker-backup');
    assert.equal(backup.version, 1);
    assert.equal(backup.createdAt, NOW);
    assert.deepEqual(backup.data, sampleState());
});

test('Sicherung: Export und Import ergeben wieder denselben Zustand', () => {
    const result = calc.parseBackup(JSON.stringify(calc.createBackup(sampleState(), NOW)), NOW);
    assert.equal(result.ok, true);
    assert.deepEqual(result.state, sampleState());
    assert.equal(result.createdAt, NOW);
    assert.deepEqual(result.summary, { days: 2, drinks: 3 });
});

test('Sicherung: Hilfsfelder der Anzeige und der Ausgangszustand bleiben unberührt', () => {
    const state = sampleState();
    state.archive[0].drinks[0]._dayLabel = 'Tag 1';
    const before = JSON.stringify(state);
    const backup = calc.createBackup(state, NOW);
    assert.equal('_dayLabel' in backup.data.archive[0].drinks[0], false);
    assert.equal(JSON.stringify(state), before);
    assert.notEqual(backup.data.archive, state.archive);
});

test('Sicherung: Dateiname trägt lokales Datum und Uhrzeit', () => {
    assert.equal(calc.backupFileName(new Date(2027, 0, 4, 9, 5)), 'drink-tracker-sicherung-2027-01-04-0905.json');
    assert.equal(calc.backupFileName(new Date(2026, 11, 31, 23, 59)), 'drink-tracker-sicherung-2026-12-31-2359.json');
});

test('Sicherung: Kennzahlen zählen Reisetage und Getränke', () => {
    assert.deepEqual(calc.backupSummary(sampleState()), { days: 2, drinks: 3 });
    assert.deepEqual(calc.backupSummary({ archive: [], currentDay: { day: 1, drinks: [] } }), { days: 1, drinks: 0 });
    assert.deepEqual(calc.backupSummary(null), { days: 0, drinks: 0 });
});

test('Import: fremde und beschädigte Dateien werden mit Meldung abgelehnt, ohne Fehler zu werfen', () => {
    const rejected = [
        ['', /kein gültiges JSON/],
        ['kein json', /kein gültiges JSON/],
        [undefined, /kein gültiges JSON/],
        ['null', /keine Sicherung des Drink Trackers/],
        ['[1,2,3]', /keine Sicherung des Drink Trackers/],
        [JSON.stringify(sampleState()), /keine Sicherung des Drink Trackers/],
        [fileText({ format: 'etwas-anderes' }), /keine Sicherung des Drink Trackers/],
        [fileText({ version: undefined }), /Formatversion/],
        [fileText({ version: '1' }), /Formatversion/],
        [fileText({ version: 0 }), /Formatversion/],
        [fileText({ version: 2 }), /neueren App-Version/],
        [fileText({ data: null }), /unvollständig/],
        [fileText({ data: [] }), /unvollständig/],
        [fileText({ data: { ...sampleState(), profile: undefined } }), /unvollständig/],
        [fileText({ data: { ...sampleState(), currentDay: null } }), /unvollständig/],
        [fileText({ data: { ...sampleState(), archive: 'x' } }), /unvollständig/],
    ];
    rejected.forEach(([text, expected]) => {
        const result = calc.parseBackup(text, NOW);
        assert.equal(result.ok, false, String(text).slice(0, 40));
        assert.match(result.error, expected);
        assert.equal(result.state, undefined);
    });
});

test('Import: Datei mit BOM wird gelesen', () => {
    assert.equal(calc.parseBackup(`﻿${fileText()}`, NOW).ok, true);
});

test('Import: Summen werden aus den Getränken neu berechnet, nicht aus der Datei übernommen', () => {
    const data = sampleState();
    data.archive[0].total = 999;
    data.archive[0].totalExtra = 999;
    data.currentDay.total = -5;
    const { state } = calc.parseBackup(fileText({ data }), NOW);
    assert.deepEqual([state.archive[0].total, state.archive[0].totalExtra], [5.5, 4.9]);
    assert.deepEqual([state.currentDay.total, state.currentDay.totalExtra], [3, 0]);
});

test('Import: ungültige Reisetage und Paketpreise fallen auf die Standardwerte zurück (nie durch 0 teilen)', () => {
    const profiles = [
        [{ duration: 0, packagePrice: 0 }, 9, 240],
        [{ duration: -3, packagePrice: -1 }, 9, 240],
        [{ duration: 2.5, packagePrice: 'abc' }, 9, 240],
        [{ duration: '7', packagePrice: '199.9' }, 7, 199.9],
        [{}, 9, 240],
    ];
    profiles.forEach(([profile, duration, packagePrice]) => {
        const { state } = calc.parseBackup(fileText({ data: { ...sampleState(), profile } }), NOW);
        assert.deepEqual([state.profile.duration, state.profile.packagePrice], [duration, packagePrice]);
        assert.ok(calc.dailyGoal(state.profile.packagePrice, state.profile.duration) > 0);
    });
    assert.deepEqual(calc.normalizeProfile(null), { name: 'Gast', nickname: 'Gaston', duration: 9, packagePrice: 240 });
});

test('Import: Sicherungen mit alten Zeilennummern-IDs und fehlenden Feldern bleiben ladbar', () => {
    const data = {
        profile: { name: 'Alt' },
        archive: [{ drinks: [{ id: 'csv-0', name: 'APPLE CRUMBLE', price: 5.5, isAI: true }] }, null, 'kaputt'],
        currentDay: { drinks: [{ id: 'csv-12', price: '4.9' }, null] },
    };
    const { ok, state } = calc.parseBackup(fileText({ data }), NOW);
    assert.equal(ok, true);
    assert.equal(state.archive.length, 1);
    assert.equal(state.archive[0].day, 1);
    assert.equal(state.archive[0].drinks[0].id, 'G0001');
    assert.equal(state.currentDay.day, 2);
    assert.deepEqual(state.currentDay.drinks.map((d) => [d.id, d.name, d.price, d.timestamp]), [['G0013', 'Unbekanntes Getränk', 4.9, NOW]]);
    assert.equal(state.currentDay.totalExtra, 4.9);
    assert.deepEqual(state.companions, []);
    assert.equal(state.profile.nickname, 'Gaston');
});

test('Import: Mitreisende werden bereinigt, Text bleibt Text', () => {
    const attack = '<img src=x onerror="alert(1)">';
    const companions = [
        { nickname: attack, limit: '240', spent: 'x', extra: null, lastUpdate: 5, fremd: true },
        { nickname: '', limit: 1 },
        null,
        'Anna',
        [1, 2],
    ];
    const { state } = calc.parseBackup(fileText({ data: { ...sampleState(), companions } }), NOW);
    assert.deepEqual(state.companions, [{ nickname: attack, limit: 240, spent: 0, extra: 0, lastUpdate: NOW }]);
    assert.equal(calc.escapeHtml(state.companions[0].nickname).includes('<'), false);
});

test('Import: Felder mit falschem Typ werden ersetzt, damit die Anzeige nie daran scheitert', () => {
    const broken = { id: { a: 1 }, name: ['x'], category: 5, price: {}, timestamp: 12345, isAI: 'ja' };
    const data = { ...sampleState(), currentDay: { day: '2', date: { jahr: 2027 }, drinks: [broken, { id: 7, category: {}, name: true }] } };
    const { ok, state } = calc.parseBackup(fileText({ data }), NOW);
    assert.equal(ok, true);
    assert.equal(state.currentDay.date, NOW);
    assert.deepEqual(state.currentDay.drinks, [
        { id: 'unknown', name: 'Unbekanntes Getränk', category: 'Sonstiges', price: 0, isNonAlcoholic: false, isAI: false, isF: false, timestamp: NOW },
        { id: '7', name: 'Unbekanntes Getränk', category: 'Sonstiges', price: 0, isNonAlcoholic: false, isAI: false, isF: false, timestamp: NOW },
    ]);
    state.currentDay.drinks.forEach((entry) => Object.values(entry).forEach((value) => assert.notEqual(typeof value, 'object')));
});

test('Import: fehlender oder ungültiger Zeitpunkt der Sicherung wird als unbekannt geführt', () => {
    assert.equal(calc.parseBackup(fileText({ createdAt: 5 }), NOW).createdAt, null);
    assert.equal(calc.parseBackup(fileText({ createdAt: undefined }), NOW).createdAt, null);
});

test('Sicherung: unvollständiger Zustand ergibt trotzdem eine vollständige, ladbare Sicherung', () => {
    [null, 'x', {}, { archive: 'x', companions: 'y' }].forEach((raw) => {
        const backup = calc.createBackup(raw, NOW);
        assert.deepEqual(backup.data, {
            profile: { name: 'Gast', nickname: 'Gaston', duration: 9, packagePrice: 240 },
            currentDay: { day: 1, date: NOW, drinks: [], total: 0, totalExtra: 0 },
            archive: [],
            companions: [],
        });
        assert.equal(calc.parseBackup(JSON.stringify(backup), NOW).ok, true);
    });
    assert.deepEqual(calc.backupSummary({}), { days: 0, drinks: 0 });
    assert.deepEqual(calc.backupSummary({ currentDay: { drinks: [drink(1)] } }), { days: 1, drinks: 1 });
    assert.match(calc.backupFileName(), /^drink-tracker-sicherung-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
});

test('Import: Mitreisende ohne erkennbaren Namen (nur Leerzeichen) entfallen', () => {
    const companions = [{ nickname: '   ', limit: 1 }, { nickname: 42, limit: 1 }];
    const { state } = calc.parseBackup(fileText({ data: { ...sampleState(), companions } }), NOW);
    assert.deepEqual(state.companions.map((c) => c.nickname), ['42']);
});

test('Import: unbekannte Zusatzfelder werden nicht übernommen', () => {
    const data = { ...sampleState(), fremd: { a: 1 }, __proto__: { polluted: true } };
    const { state } = calc.parseBackup(fileText({ data, zusatz: 'x' }), NOW);
    assert.deepEqual(Object.keys(state).sort(), ['archive', 'companions', 'currentDay', 'profile']);
    assert.equal({}.polluted, undefined);
});
