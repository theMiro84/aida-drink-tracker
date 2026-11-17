const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, readPrecacheList, readVersion, computeVersion } = require('../scripts/sw-version.js');

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const precache = readPrecacheList();

// Lokale Dateien, auf die eine HTML- oder CSS-Datei verweist (relativ zu ihrem Ordner).
function localReferences(file) {
    const source = read(file);
    const patterns = [/(?:src|href)="([^"]+)"/g, /url\(\s*['"]?([^'")]+)['"]?\s*\)/g];
    const found = patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));
    return found
        .filter((ref) => !/^(data:|https?:|#)/.test(ref))
        .map((ref) => path.posix.join(path.posix.dirname(file), ref));
}

test('Service Worker: jede gespeicherte Datei existiert', () => {
    for (const file of precache.filter((entry) => entry !== './')) {
        assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} fehlt`);
    }
});

test('Service Worker: alle von der App geladenen Dateien werden offline gespeichert', () => {
    const needed = new Set(['index.html', 'data/getraenke.csv']);
    JSON.parse(read('manifest.json')).icons.forEach((icon) => needed.add(icon.src));
    for (const file of ['index.html', 'styles.css', 'vendor/fonts/fonts.css']) {
        localReferences(file).forEach((ref) => needed.add(ref));
    }
    const missing = [...needed].filter((file) => !precache.includes(file));
    assert.deepEqual(missing, [], 'in PRECACHE (sw.js) ergänzen');
    assert.ok(needed.size > 10, 'Verweise wurden gefunden');
});

test('Offline: die App lädt nichts von fremden Servern', () => {
    for (const file of ['index.html', 'styles.css', 'vendor/fonts/fonts.css', 'manifest.json', 'app.js', 'calc.js', 'sw.js']) {
        const external = read(file).match(/https?:\/\/(?!www\.w3\.org\/)[^\s'")<>]+/g) || [];
        assert.deepEqual(external, [], `${file} verweist auf fremde Adressen`);
    }
});

test('Service Worker: Fingerabdruck ist aktuell (sonst: npm run sw:version)', () => {
    assert.equal(readVersion(), computeVersion(), 'Dateien wurden geändert, ohne den Fingerabdruck zu erneuern: npm run sw:version ausführen');
});

test('Service Worker: wird von der App registriert', () => {
    assert.match(read('app.js'), /navigator\.serviceWorker\.register\('sw\.js'\)/);
});
