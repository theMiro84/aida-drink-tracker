# CLAUDE.md

Drink Tracker: mobile Web-App (PWA) für Reisen mit Getränkepaket. Sie zählt
Getränke pro Tag und zeigt, ob der Tagesanteil des Pakets erreicht ist. Läuft
offline auf dem Handy; alle Daten liegen im Browser des Geräts.

## Arbeitsweise

- Delegiere jede Repo-Suche und jeden Testlauf an die Haiku-5.5-Subagenten
  (`search` für Struktur, `grep` für Aufrufstellen, `audit` für Diff-Checks und
  Testläufe), um den Hauptkontext klein zu halten. Das gilt für die
  Haupt-Session; Subagenten führen ihre Suchen und Testläufe selbst aus.
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

- `index.html`, `styles.css`: Oberfläche. Vanilla JS, kein Build-Schritt.
- `app.js`: Zustand, Speicherung (`localStorage`), Anzeige. Klassisches Skript
  mit globalen Funktionen.
- `calc.js`: Rechenkern als reine Funktionen (`DrinkCalc`), läuft im Browser
  und in Node. Hier liegt jede Formel.
- `sw.js`: Service Worker für Offline-Betrieb und automatische Updates. Jede
  Datei, die die App lädt, steht in `PRECACHE`.
- `data/getraenke.csv`: Getränke. `ID` ist stabil und wird nie neu vergeben.
- `vendor/`: mitgelieferte Schriften und QR-Bibliotheken. Die App lädt nichts
  von fremden Servern; neue Bibliotheken kommen hierher, mit Lizenzangabe in
  `vendor/README.md`. Keine GPL-Bibliotheken (das Repo steht unter MIT).
- `tests/` (Node, ohne Abhängigkeiten), `e2e/` (Playwright).

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
