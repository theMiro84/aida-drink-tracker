# CLAUDE.md

Drink Tracker: mobile Web-App (PWA) für Reisen mit Getränkepaket. Sie zählt
Getränke pro Tag und zeigt, ob der Tagesanteil des Pakets erreicht ist. Läuft
offline auf dem Handy; alle Daten liegen im Browser des Geräts.

## Arbeitsweise

- Orientierung über die Repo-Karte unten („Aufbau“), nicht über einen Scan.
  Dateien und Bereiche, die dort stehen, liest die Haupt-Session direkt.
- An die Haiku-5.5-Subagenten gehen nur breite Fragen: `search`, wenn die Karte
  nicht reicht oder veraltet wirkt; `grep` für vollständige Listen von
  Aufrufstellen über mehrere Dateien. Testläufe gehen weiter an `audit`.
- `audit` läuft in einem eigenen Worktree und sieht nur Committetes: erst
  committen, dann prüfen lassen, erst nach grünem Ergebnis pushen.
- Neue oder geänderte Rechenlogik gehört in `calc.js` und bekommt im selben
  Schritt Tests in `tests/`; neue Bedienabläufe einen Fall in `e2e/app.e2e.js`.
  Ohne passende Tests gilt eine Änderung als nicht fertig.
- Nach jeder Änderung an App-Dateien `npm run sw:version` ausführen und `sw.js`
  mit committen. Sonst erkennen installierte Geräte die neue Version nicht.
- Consult the advisor before locking a plan, after the same error twice, and
  before calling a task done.
- Rollen, Loop und Modell-Updates: `.claude/agents/README.md`.

## Aufbau

Repo-Karte. Neue Datei, neuer Ordner oder neuer Bereich: Karte im selben Commit
anpassen. `tests/config.test.js` prüft, dass jede Datei und jeder Ordner hier
vorkommt. Bereiche werden über Funktionsnamen benannt, nicht über Zeilennummern.

App (Vanilla JS, kein Build-Schritt):

- `index.html`: Oberfläche mit den Ansichten `view-tag` (Getränke buchen),
  `view-dashboard` (Übersicht), `view-history` (Historie, Datensicherung),
  `view-profile` (Profil), dazu das Sync-Modal für QR-Codes.
- `styles.css`: Gestaltung.
- `app.js`: Zustand, Speicherung (`localStorage`), Anzeige. Klassisches Skript
  mit globalen Funktionen, in Abschnitte gegliedert:
  - Profil: `renderProfile`, `saveProfileData`, `getDailyGoal`
  - Stammdaten, Tage: `drinksData`, `favorites`, `normalizeDay`, `createNewDay`
  - Laden/Speichern: `loadState`, `saveState`
  - Aktionen: `addDrink`, `undoLastDrink`, `startNewDay`, `resetApp`
  - Anzeige: `switchScreen`, `updateUI`, `initSearch`, `renderDrinkList`,
    `renderFavorites`, `renderOverview`, `renderHistory` (Filter:
    `initHistoryFilters`)
  - Mitreisende per QR: `getSocialPayload`, `processScannedCompanion`,
    `renderSocialTable`, Modal und Scanner (`openSyncModal`, `renderMyQRCode`,
    `startScanner`, `onScanSuccess`)
  - Datensicherung: `initBackup`, `applyBackupText`, `importBackupFile`,
    `downloadBackupFile`
  - Start: `registerServiceWorker`
- `calc.js`: Rechenkern als reine Funktionen (`DrinkCalc`), läuft im Browser
  und in Node. Hier liegt jede Formel:
  - Geld und Text: `roundMoney`, `safeRatio`, `formatMoney`, `escapeHtml`
  - Paket: `dailyGoal`, `isIncluded`, `sumIncluded`, `sumExtra`, `progress`
  - Daten: `parseDrinksCsv`, `migrateDrinkId`, `normalizeDay`,
    `normalizeState`, `aggregateStats`
  - Datensicherung: `createBackup`, `parseBackup`, `backupSummary`,
    `backupFileName` (Format `drink-tracker-backup`, `BACKUP_VERSION`)
- `sw.js`: Service Worker für Offline-Betrieb und automatische Updates. Jede
  Datei, die die App lädt, steht in `PRECACHE`; `VERSION` erneuert
  `npm run sw:version`.
- `manifest.json`, `icons/`: Installation als App auf dem Startbildschirm.
- `data/` mit `data/getraenke.csv`: Getränke. `ID` ist stabil und wird nie neu vergeben.
- `vendor/`: mitgelieferte Schriften und QR-Bibliotheken. Die App lädt nichts
  von fremden Servern; neue Bibliotheken kommen hierher, mit Lizenzangabe in
  `vendor/README.md`. Keine GPL-Bibliotheken (das Repo steht unter MIT).

Tests und Werkzeuge:

- `tests/` (Node, ohne Abhängigkeiten):
  - `tests/calc.test.js`: Rechenkern
  - `tests/backup.test.js`: Datensicherung
  - `tests/data.test.js`: Getränkedaten
  - `tests/sw.test.js`: Service Worker und `PRECACHE`
  - `tests/config.test.js`: Modell-Konfiguration und diese Karte
- `e2e/` (Playwright): `e2e/app.e2e.js` mit einem Fall pro Bedienablauf.
- `scripts/` mit `scripts/sw-version.js`: erneuert den Fingerabdruck in `sw.js`.
- `package.json`: npm-Befehle (siehe unten).
- `.github/`: GitHub Action `Tests`.
- `.claude/`: Modelle (`settings.json`) und Subagenten (`agents/`).
- `CLAUDE.md` (diese Datei), `README.md`, `LICENSE` (MIT), `.gitignore`, `.gitattributes`.

## Befehle

- `npm test`: Syntax-Check, Rechenkern, Getränkedaten, Service Worker, Modell-Konfiguration.
- `npm run test:e2e`: Browser-Test der Bedienabläufe. `BROWSER=webkit` testet Safari-Technik.
- `npm run test:all`: beides.
- `npm run sw:version`: Fingerabdruck in `sw.js` erneuern.

## Fachregeln

- Tagesziel = Paketpreis / Reisetage, auf Cent gerundet (240 € / 9 Tage = 26,67 €).
- Für die Gesamtbilanz zählt der Paketpreis, nicht die Summe der Tagesziele.
- Ein Getränk ist im Paket enthalten oder nicht. Getränke außerhalb des Pakets
  (Sondergetränke) zählen mit vollem Preis als Zuzahlung und nicht zum Paket.
- Pakete: All Inclusive (CSV-Spalte `AI`) und Fun (Spalte `F`, alkoholfrei).
  Der Rechenkern kann beide; die Auswahl in der Oberfläche fehlt noch.
- Nie durch 0 teilen: Division nur über `DrinkCalc.safeRatio`. Reisetage sind
  ganze Zahlen ab 1, der Paketpreis ist größer als 0.
- Geld wird kaufmännisch auf Cent gerundet (`DrinkCalc.roundMoney`).
- Text aus fremden Quellen (QR-Codes, importierte Daten) vor der Ausgabe in
  HTML mit `DrinkCalc.escapeHtml` behandeln.
- Gespeicherte Daten älterer Versionen müssen weiter ladbar bleiben.

## Betrieb

- GitHub Pages veröffentlicht den Branch `main`. Ein Merge nach `main` ist ein
  Release auf alle installierten Geräte.
- Die GitHub Action `Tests` läuft bei jedem Push. Rot heißt: nicht mergen.
- Zielgeräte: iPhone (Safari) und Android (Chrome), als App auf dem Startbildschirm.
- Pull Requests nur auf ausdrücklichen Wunsch anlegen.

## Konventionen

- Sprache in Oberfläche, Doku, Tests und Commits: Deutsch.
- Zeilenenden: LF (`.gitattributes`), Einrückung 4 Leerzeichen.
- Kleine, fokussierte Änderungen; bestehendes Verhalten nur auf Auftrag ändern.
