// Browser-Test der Bedienabläufe. Start: npm run test:e2e
// Die Fälle bauen aufeinander auf und teilen sich eine Seite, wie eine echte Reise.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const playwright = require('playwright');

// BROWSER=webkit testet mit der Technik von Safari, Standard ist Chromium.
const browserType = playwright[process.env.BROWSER || 'chromium'];

const ROOT = path.join(__dirname, '..');
const STORAGE_KEY = 'aida_drink_tracker_v1';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.csv': 'text/csv' };

let server;
let baseUrl;
let browser;
let page;
const pageErrors = [];
const dialogs = [];
const externalRequests = [];
// Dateien, die der Testserver mit anderem Inhalt ausliefert (simuliert eine neue Version).
const overrides = new Map();
// true: Der Testserver kappt jede Verbindung, wie ein Gerät ohne Netz.
let offline = false;

function startServer() {
    return new Promise((resolve) => {
        server = http.createServer((req, res) => {
            if (offline) {
                req.socket.destroy();
                return;
            }
            const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
            const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
            if (overrides.has(urlPath)) {
                res.writeHead(200, { 'Content-Type': `${MIME[path.extname(file)]}; charset=utf-8` });
                res.end(overrides.get(urlPath));
                return;
            }
            if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
                res.writeHead(404).end();
                return;
            }
            res.writeHead(200, { 'Content-Type': `${MIME[path.extname(file)] || 'application/octet-stream'}; charset=utf-8` });
            fs.createReadStream(file).pipe(res);
        });
        server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`));
    });
}

// Öffnet die App in einem frischen Browser-Profil. Anfragen an fremde Server
// werden blockiert und protokolliert; die App darf keine brauchen.
async function openApp(savedState) {
    offline = false;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
        externalRequests.push(route.request().url());
        return route.abort();
    });
    if (savedState) {
        await context.addInitScript(
            ([key, value]) => {
                if (!localStorage.getItem(key)) localStorage.setItem(key, value);
            },
            [STORAGE_KEY, JSON.stringify(savedState)]
        );
    }
    const newPage = await context.newPage();
    newPage.on('pageerror', (error) => pageErrors.push(String(error)));
    newPage.on('dialog', (dialog) => {
        dialogs.push(dialog.message());
        dialog.accept();
    });
    await newPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await newPage.waitForSelector('#category-list .drink-card', { state: 'attached' });
    return newPage;
}

async function expectText(selector, expected, target = page) {
    await target
        .waitForFunction(([s, e]) => document.querySelector(s)?.textContent.trim() === e, [selector, expected], { timeout: 4000 })
        .catch(() => {});
    assert.equal((await target.locator(selector).textContent()).trim(), expected, selector);
}

async function bookFromList(name) {
    await page.fill('#drink-search', name);
    await page.locator('#category-list .drink-card:not(.hidden)', { hasText: name }).first().click();
    await page.click('#clear-search');
}

async function goTo(screen) {
    await page.click(`.nav-item[data-screen="${screen}"]`);
    await page.waitForSelector(`#view-${screen}:not(.hidden)`);
}

const savedState = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);

before(async () => {
    baseUrl = await startServer();
    browser = await browserType.launch();
    page = await openApp();
});

after(async () => {
    await browser?.close();
    server?.close();
});

test('Start: leerer erster Tag mit Tagesziel 26,67 €', async () => {
    await expectText('#day-label', 'Tag 1');
    await expectText('#total-amount', '0,00 €');
    await expectText('#limit-info', 'Limit verbleibend: 26,67 €');
    assert.equal(await page.locator('#category-list .drink-card').count(), 231);
    assert.ok(await page.locator('#undo-btn').isDisabled());
});

test('Getränk aus dem Paket buchen: Tagessumme steigt, Restbetrag sinkt', async () => {
    await bookFromList('APPLE CRUMBLE');
    await expectText('#total-amount', '5,50 €');
    await expectText('#limit-info', 'Limit verbleibend: 21,17 €');
});

test('Sondergetränk buchen: Tagessumme bleibt, Zuzahlung wird ausgewiesen', async () => {
    await bookFromList('OUZO 12 4 cl');
    await expectText('#limit-info', 'Limit verbleibend: 21,17 €Zuzahlung heute: 4,90 €');
    await expectText('#total-amount', '5,50 €');
});

test('Favoriten: gebuchte Getränke erscheinen als Kacheln und lassen sich erneut buchen', async () => {
    await page.waitForSelector('.favorites-section:not(.hidden)');
    assert.equal(await page.locator('#fav-grid .fav-card').count(), 2);
    await page.locator('#fav-grid .fav-card', { hasText: 'APPLE CRUMBLE' }).click();
    await expectText('#total-amount', '11,00 €');
    await expectText('#limit-info', 'Limit verbleibend: 15,67 €Zuzahlung heute: 4,90 €');
});

test('Rückgängig: nimmt die letzte Buchung zurück', async () => {
    await page.click('#undo-btn');
    await expectText('#total-amount', '5,50 €');
    await expectText('#limit-info', 'Limit verbleibend: 21,17 €Zuzahlung heute: 4,90 €');
});

test('Historie: zeigt Buchungen, Kennzeichen Zuzahlung und Tageszusammenfassung', async () => {
    await goTo('history');
    await expectText('#summary-count', '2');
    await expectText('#summary-alcohol-count', '1');
    await expectText('#summary-budget-total', '5,50 €');
    const entries = page.locator('#history-groups-container .drink-card');
    assert.equal(await entries.count(), 2);
    assert.equal(await entries.filter({ hasText: '(Zuzahlung)' }).count(), 1);
    assert.match(await entries.filter({ hasText: '(Zuzahlung)' }).textContent(), /OUZO 12 4 cl/);
    const width = await page.locator('#summary-budget-fill').evaluate((el) => parseFloat(el.style.width));
    assert.ok(Math.abs(width - (5.5 / 26.67) * 100) < 0.01, `Balkenbreite ${width}`);
});

test('Tag abschließen: neuer leerer Tag, Dashboard zeigt die Gesamtbeträge', async () => {
    await goTo('tag');
    dialogs.length = 0;
    await page.click('#next-day-btn');
    await expectText('#day-label', 'Tag 2');
    assert.match(dialogs[0], /Tag 1 wirklich abschließen/);
    await expectText('#total-amount', '0,00 €');
    await expectText('#limit-info', 'Limit verbleibend: 26,67 €');

    await goTo('dashboard');
    await expectText('#grand-total-display', '5,50 €');
    await expectText('#stats-extra', '4,90 €');
    await expectText('#stats-remaining', '234,50 €');
    await expectText('#status-badge', '2% erreicht');
    await expectText('#total-drinks-count', 'Gesamtanzahl: 2');
});

test('Profil: ungültige Reisetage und Paketpreise werden abgelehnt', async () => {
    await page.click('#profile-open-btn');
    await page.waitForSelector('#view-profile:not(.hidden)');

    for (const [duration, price] of [['0', '240'], ['9.5', '240'], ['', '240'], ['9', '0'], ['9', '-5'], ['9', '']]) {
        dialogs.length = 0;
        await page.fill('#prof-duration', duration);
        await page.fill('#prof-price', price);
        await page.click('#save-profile-btn');
        assert.deepEqual(dialogs, ['Bitte ganze Reisetage (mindestens 1) und einen Paketpreis über 0 € angeben.'], `${duration} Tage / ${price} €`);
        assert.ok(await page.locator('#view-profile').isVisible(), 'Profil bleibt offen');
        const { profile } = await savedState();
        assert.deepEqual([profile.duration, profile.packagePrice], [9, 240], 'gespeichertes Profil unverändert');
    }
});

test('Profil: gültige Werte ändern Tagesziel und Restbetrag des Pakets', async () => {
    dialogs.length = 0;
    await page.fill('#prof-duration', '8');
    await page.fill('#prof-price', '200');
    await page.click('#save-profile-btn');
    assert.deepEqual(dialogs, ['Profil aktualisiert!']);
    await page.waitForSelector('#view-dashboard:not(.hidden)');
    await expectText('#stats-remaining', '194,50 €');
    await expectText('#status-badge', '3% erreicht');
    await goTo('tag');
    await expectText('#limit-info', 'Limit verbleibend: 25,00 €');
});

test('Vergleichstabelle: mehrere Mitreisende, sortiert, ohne Division durch 0', async () => {
    await goTo('dashboard');
    // Mitreisende kommen in der App nur per QR-Scan; der Test übergibt den gescannten Inhalt direkt.
    const accepted = await page.evaluate(() => [
        processScannedCompanion(JSON.stringify(['Anna', 240, 120, 10])),
        processScannedCompanion(JSON.stringify(['Ben', 0, 50, 0])),
        processScannedCompanion(JSON.stringify(['Cleo', 100, 250, 0])),
        processScannedCompanion('kein json'),
    ]);
    assert.deepEqual(accepted, [true, true, true, false]);

    await page.waitForSelector('#social-table-wrapper:not(.hidden)');
    const rows = await page.locator('#social-ranking-body tr').evaluateAll((trs) =>
        trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).concat(tr.classList.contains('is-me') ? 'ich' : ''))
    );
    assert.deepEqual(rows, [
        ['Cleo', '250,00 €', '250%', ''],
        ['Anna', '120,00 €', '50%', ''],
        ['Ben', '50,00 €', '0%', ''],
        ['Gaston (Du)', '5,50 €', '3%', 'ich'],
    ]);
});

test('Neustart: Buchungen, Profil und Mitreisende bleiben gespeichert', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#category-list .drink-card', { state: 'attached' });
    await expectText('#day-label', 'Tag 2');
    await expectText('#limit-info', 'Limit verbleibend: 25,00 €');
    await goTo('dashboard');
    await expectText('#grand-total-display', '5,50 €');
    await expectText('#stats-extra', '4,90 €');
    assert.equal(await page.locator('#social-ranking-body tr').count(), 4);

    const state = await savedState();
    assert.deepEqual(state.archive[0].drinks.map((drink) => drink.id), ['G0001', 'G0013']);
    assert.deepEqual([state.archive[0].total, state.archive[0].totalExtra], [5.5, 4.9]);
});

// Wählt im Reiter Historie eine Datei zum Einspielen aus.
const chooseBackupFile = (text, name = 'sicherung.json') =>
    page.setInputFiles('#backup-import-file', { name, mimeType: 'application/json', buffer: Buffer.from(text, 'utf8') });

// Legt fest, ob der Browser Dateien teilen kann (iPhone) oder nicht (Download).
const setShareSupport = (enabled) =>
    page.evaluate((on) => {
        window.__geteilt = null;
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: on ? () => true : undefined });
        Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: on
                ? async (data) => {
                      window.__geteilt = { name: data.files[0].name, text: await data.files[0].text() };
                  }
                : undefined,
        });
    }, enabled);

test('Datensicherung: Stand als Datei sichern, nach dem Zurücksetzen wieder einspielen', async () => {
    await goTo('history');
    const before = await savedState();

    // Sichern als Download.
    await setShareSupport(false);
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#backup-export-btn')]);
    assert.match(download.suggestedFilename(), /^drink-tracker-sicherung-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
    const backupText = fs.readFileSync(await download.path(), 'utf8');
    const backup = JSON.parse(backupText);
    assert.deepEqual([backup.format, backup.version], ['drink-tracker-backup', 1]);
    assert.deepEqual(backup.data, before);
    await expectText('#backup-status', `Sicherung erstellt: ${download.suggestedFilename()} (2 Reisetage, 2 Getränke).`);

    // Sichern über "Teilen" (Weg auf dem iPhone).
    await setShareSupport(true);
    await page.click('#backup-export-btn');
    await page.waitForFunction(() => window.__geteilt !== null);
    const shared = await page.evaluate(() => window.__geteilt);
    assert.match(shared.name, /^drink-tracker-sicherung-.*\.json$/);
    assert.deepEqual(JSON.parse(shared.text).data, before);
    await expectText('#backup-status', 'Sicherung übergeben (2 Reisetage, 2 Getränke). Bitte an einem sicheren Ort ablegen.');
    await setShareSupport(false);

    // Fremde und beschädigte Dateien ändern nichts.
    dialogs.length = 0;
    await chooseBackupFile('kein json');
    await expectText('#backup-status', 'Die Datei ist keine lesbare Sicherung (kein gültiges JSON).');
    await chooseBackupFile(JSON.stringify({ hallo: 'welt' }));
    await expectText('#backup-status', 'Die Datei ist keine Sicherung des Drink Trackers.');
    assert.equal(await page.locator('#backup-status.text-error').count(), 1);
    assert.deepEqual(dialogs, []);
    assert.deepEqual(await savedState(), before);

    // Daten gehen verloren (hier: Zurücksetzen) ...
    await goTo('dashboard');
    await page.click('#reset-app-btn');
    await expectText('#day-label', 'Tag 1');
    assert.equal((await savedState()).archive.length, 0);

    // ... und kommen aus der Datei zurück, nach einer Rückfrage.
    await goTo('history');
    dialogs.length = 0;
    await chooseBackupFile(backupText);
    await expectText('#backup-status', 'Sicherung eingespielt (2 Reisetage, 2 Getränke).');
    assert.equal(await page.locator('#backup-status.text-error').count(), 0);
    assert.match(dialogs[0], /^Sicherung vom \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} einspielen\?/);
    assert.match(dialogs[0], /Inhalt der Sicherung: 2 Reisetage, 2 Getränke\./);
    assert.match(dialogs[0], /\(1 Reisetag, 0 Getränke\) wird dabei ersetzt/);
    assert.deepEqual(await savedState(), before);

    // Die Anzeige zeigt den eingespielten Stand, auch nach einem Neustart.
    await page.locator('#view-history .tab-item', { hasText: 'Alle' }).click();
    assert.equal(await page.locator('#history-groups-container .drink-card').count(), 2);
    await page.locator('#view-history .tab-item', { hasText: 'Heute' }).click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#category-list .drink-card', { state: 'attached' });
    await expectText('#day-label', 'Tag 2');
    await goTo('dashboard');
    await expectText('#grand-total-display', '5,50 €');
    assert.equal(await page.locator('#social-ranking-body tr').count(), 4);
});

test('Datensicherung: HTML in einer eingespielten Sicherung wird als Text angezeigt, nicht ausgeführt', async () => {
    const original = await savedState();
    const attack = '<img src=x onerror="window.__xssBackup = true">';
    const manipulated = JSON.parse(JSON.stringify(original));
    manipulated.archive[0].drinks[0].name = attack;
    manipulated.companions.push({ nickname: attack, limit: 240, spent: 1, extra: 0 });
    const file = (data) => JSON.stringify({ format: 'drink-tracker-backup', version: 1, createdAt: attack, data });

    await goTo('history');
    await chooseBackupFile(file(manipulated));
    await expectText('#backup-status', 'Sicherung eingespielt (2 Reisetage, 2 Getränke).');
    await page.locator('#view-history .tab-item', { hasText: 'Alle' }).click();
    assert.equal(await page.locator('#history-groups-container .drink-card', { hasText: attack }).count(), 1);
    await goTo('dashboard');
    assert.equal(await page.locator('#social-ranking-body tr', { hasText: attack }).count(), 1);
    assert.equal(await page.locator('#view-history img, #view-dashboard img, #backup-status img').count(), 0);
    assert.equal(await page.evaluate(() => window.__xssBackup), undefined);

    // Ursprünglichen Stand wiederherstellen.
    await goTo('history');
    await chooseBackupFile(file(original));
    await page.waitForFunction(([key, name]) => !localStorage.getItem(key).includes(name), [STORAGE_KEY, 'onerror']);
    assert.deepEqual(await savedState(), original);
    await page.locator('#view-history .tab-item', { hasText: 'Heute' }).click();
});

test('Tag zurückholen: Rückgängig am leeren Tag öffnet den Vortag wieder', async () => {
    await goTo('tag');
    dialogs.length = 0;
    await page.click('#undo-btn');
    await expectText('#day-label', 'Tag 1');
    assert.match(dialogs[0], /Tag 1 wieder aus dem Archiv holen/);
    await expectText('#total-amount', '5,50 €');
});

test('Sicherheit: HTML in einem gescannten Spitznamen wird als Text angezeigt, nicht ausgeführt', async () => {
    await goTo('dashboard');
    const attack = '<img src=x onerror="window.__xss = true">';
    assert.equal(await page.evaluate((name) => processScannedCompanion(JSON.stringify([name, 240, 1, 0])), attack), true);
    await page.waitForFunction(() => document.querySelectorAll('#social-ranking-body tr').length === 5);
    assert.equal(await page.locator('#social-ranking-body tr', { hasText: attack }).count(), 1);
    assert.equal(await page.locator('#social-ranking-body img').count(), 0);
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    await goTo('tag');
});

test('Alte gespeicherte Daten: Zeilennummern-IDs werden übernommen, Favoriten bleiben', async () => {
    const legacyPage = await openApp({
        profile: { name: 'Alt', nickname: 'Alt', duration: 9, packagePrice: 240 },
        archive: [],
        currentDay: {
            day: 3,
            total: 999,
            drinks: [
                { id: 'csv-0', name: 'APPLE CRUMBLE', price: 5.5, isNonAlcoholic: true, isAI: true },
                { id: 'csv-12', name: 'OUZO 12 4 cl', price: 4.9, isAI: false },
            ],
        },
        companions: [],
    });
    await expectText('#day-label', 'Tag 3', legacyPage);
    await expectText('#total-amount', '5,50 €', legacyPage);
    await expectText('#limit-info', 'Limit verbleibend: 21,17 €Zuzahlung heute: 4,90 €', legacyPage);
    const favorites = await legacyPage.locator('#fav-grid .fav-name').allTextContents();
    assert.deepEqual(favorites.map((name) => name.trim()).sort(), ['APPLE CRUMBLE', 'OUZO 12 4 cl']);
    await legacyPage.context().close();
});

// Wartet, bis der Service Worker die Seite übernommen hat.
const waitForServiceWorker = (target) => target.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 });

test('Offline: App startet ohne Netz mit Getränken, Schriften, Icons und QR-Code', async () => {
    const offlinePage = await openApp();
    await waitForServiceWorker(offlinePage);
    offline = true;
    await offlinePage.reload({ waitUntil: 'domcontentloaded' });
    await offlinePage.waitForSelector('#category-list .drink-card', { state: 'attached' });

    assert.equal(await offlinePage.locator('#category-list .drink-card').count(), 231);
    await expectText('#limit-info', 'Limit verbleibend: 26,67 €', offlinePage);

    const fonts = await offlinePage.evaluate(async () => {
        await document.fonts.ready;
        const loaded = [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family.replace(/["']/g, ''));
        return [...new Set(loaded)].sort();
    });
    assert.deepEqual(fonts, ['Inter', 'Material Symbols Outlined', 'Plus Jakarta Sans']);

    // Ein Icon ist ein einzelnes Zeichen der Icon-Schrift; ohne Schrift stünde dort breiter Klartext.
    const iconWidth = await offlinePage.locator('.nav-item .material-symbols-outlined').first().evaluate((el) => el.getBoundingClientRect().width);
    assert.ok(iconWidth > 0 && iconWidth <= 32, `Icon-Breite ${iconWidth}`);

    assert.deepEqual(await offlinePage.evaluate(() => [typeof qrcode, typeof Html5Qrcode]), ['function', 'function']);

    // Eigenen QR-Code erzeugen und mit dem Scanner der App wieder einlesen (ohne Kamera).
    await offlinePage.evaluate(() => {
        state.profile.nickname = 'Jürgen Müßig';
    });
    await offlinePage.click('.nav-item[data-screen="dashboard"]');
    await offlinePage.click('#open-sync-btn');
    await offlinePage.waitForFunction(() => document.getElementById('my-qr-code').width >= 250);
    const [decoded, payload] = await offlinePage.evaluate(async () => {
        const canvas = document.getElementById('my-qr-code');
        const blob = await new Promise((resolve) => canvas.toBlob(resolve));
        const scanner = new Html5Qrcode('qr-reader');
        return [await scanner.scanFile(new File([blob], 'qr.png', { type: 'image/png' }), false), getSocialPayload()];
    });
    assert.equal(decoded, payload);
    assert.deepEqual(JSON.parse(decoded), ['Jürgen Müßig', 240, 0, 0]);

    await offlinePage.context().close();
});

test('Update: eine neue Version wird automatisch geladen und ersetzt die alte', async () => {
    const updatePage = await openApp();
    await waitForServiceWorker(updatePage);
    const oldCaches = await updatePage.evaluate(() => caches.keys());
    assert.equal(oldCaches.length, 1);
    assert.equal(await updatePage.evaluate(() => window.__neueVersion), undefined);

    // Neue Version bereitstellen: geänderte Datei plus neuer Fingerabdruck in sw.js.
    overrides.set('/calc.js', `${fs.readFileSync(path.join(ROOT, 'calc.js'), 'utf8')}\nglobalThis.__neueVersion = true;\n`);
    overrides.set('/sw.js', fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').replace(/const VERSION = '[^']*';/, "const VERSION = 'e2e-neu';"));
    try {
        // Beim nächsten Öffnen prüft der Browser sw.js; die Seite lädt sich danach selbst neu.
        await updatePage.reload({ waitUntil: 'domcontentloaded' });
        await updatePage.waitForFunction(() => window.__neueVersion === true, null, { timeout: 20000 });
        await updatePage.waitForFunction(async () => (await caches.keys()).join() === 'drink-tracker-e2e-neu', null, { timeout: 10000 });
        await expectText('#day-label', 'Tag 1', updatePage);
    } finally {
        overrides.clear();
        await updatePage.context().close();
    }
});

test('Keine Skriptfehler und keine Anfragen an fremde Server während des gesamten Ablaufs', () => {
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(externalRequests, []);
});
