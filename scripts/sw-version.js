// Berechnet den Fingerabdruck für den Service Worker und schreibt ihn in sw.js.
// Aufruf: npm run sw:version
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SW_PATH = path.join(ROOT, 'sw.js');
const TEXT_EXTENSIONS = new Set(['.html', '.css', '.js', '.json', '.csv']);

function readPrecacheList(swSource = fs.readFileSync(SW_PATH, 'utf8')) {
    const block = /const PRECACHE = \[([\s\S]*?)\];/.exec(swSource);
    if (!block) throw new Error('PRECACHE-Liste in sw.js nicht gefunden');
    return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

function readVersion(swSource = fs.readFileSync(SW_PATH, 'utf8')) {
    const match = /const VERSION = '([^']*)';/.exec(swSource);
    if (!match) throw new Error('VERSION in sw.js nicht gefunden');
    return match[1];
}

// Fingerabdruck über alle gespeicherten Dateien. Zeilenenden werden bei
// Textdateien vereinheitlicht, damit Windows und Linux dasselbe Ergebnis liefern.
function computeVersion() {
    const hash = crypto.createHash('sha256');
    for (const file of readPrecacheList().filter((entry) => entry !== './')) {
        let content = fs.readFileSync(path.join(ROOT, file));
        if (TEXT_EXTENSIONS.has(path.extname(file))) content = Buffer.from(content.toString('utf8').replace(/\r\n/g, '\n'));
        hash.update(file).update('\0').update(content).update('\0');
    }
    return hash.digest('hex').slice(0, 12);
}

function writeVersion() {
    const source = fs.readFileSync(SW_PATH, 'utf8');
    const version = computeVersion();
    fs.writeFileSync(SW_PATH, source.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`));
    return version;
}

module.exports = { ROOT, readPrecacheList, readVersion, computeVersion };

if (require.main === module) {
    const before = readVersion();
    const after = writeVersion();
    console.log(before === after ? `sw.js ist aktuell (${after})` : `sw.js aktualisiert: ${before} -> ${after}`);
}
