const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const PINNED = /^claude-[a-z]+-\d+(-\d+)*$/;

const agentModel = (name) => /^model:\s*(\S+)\s*$/m.exec(read(`.claude/agents/${name}.md`))?.[1];
const settings = JSON.parse(read('.claude/settings.json'));
const configured = {
    model: settings.model,
    advisorModel: settings.advisorModel,
    search: agentModel('search'),
    grep: agentModel('grep'),
    audit: agentModel('audit'),
    executor: agentModel('executor'),
};

test('Modelle: überall volle Modell-IDs statt Kurznamen', () => {
    for (const [where, model] of Object.entries(configured)) {
        assert.match(String(model), PINNED, `${where}: "${model}" ist keine volle Modell-ID`);
    }
});

test('Modelle: Tabelle "Modell-Updates" im Agenten-README passt zu den Dateien', () => {
    const table = read('.claude/agents/README.md').split('## Modell-Updates')[1].split('## Regeln')[0];
    const documented = [...table.matchAll(/`(claude-[a-z0-9-]+)`/g)].map((match) => match[1]);
    assert.deepEqual(documented, [configured.model, configured.advisorModel, configured.search, configured.executor]);
    assert.equal(configured.grep, configured.search);
    assert.equal(configured.audit, configured.search);
});

test('Audit läuft isoliert und sieht den Arbeits-Branch', () => {
    assert.match(read('.claude/agents/audit.md'), /^isolation:\s*worktree\s*$/m);
    assert.equal(settings.worktree?.baseRef, 'head');
});

test('Repo-Karte in CLAUDE.md nennt jede Datei und jeden Ordner', () => {
    // Nur Dateien unter Versionskontrolle: lokale Reste (node_modules,
    // Testergebnisse) gehören nicht in die Karte.
    const tracked = require('node:child_process')
        .execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
    const map = read('CLAUDE.md').split('## Aufbau')[1].split('\n## ')[0];
    const named = new Set([...map.matchAll(/`([^`\s]+)`/g)].map((match) => match[1]));

    const required = new Set();
    for (const file of tracked) {
        const [top, ...rest] = file.split('/');
        // Oberste Ebene: Dateien mit Namen, Ordner als `ordner/`.
        required.add(rest.length ? `${top}/` : top);
        // Tests und Skripte einzeln, weil dort jede Datei eine eigene Aufgabe hat.
        if (['tests', 'e2e', 'scripts'].includes(top)) required.add(file);
    }

    const missing = [...required].filter((entry) => !named.has(entry));
    assert.deepEqual(missing, [], `In der Repo-Karte (CLAUDE.md, Abschnitt "Aufbau") fehlen: ${missing.join(', ')}`);
});
