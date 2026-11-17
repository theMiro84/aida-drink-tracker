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
