# AIDA Drink Tracker

Kleine mobile Web-App (PWA) zur Erfassung des täglichen Getränkekonsums auf Reisen mit Getränkepaket.

Die App ist zunächst für eine konkrete Test- und Produktionsphase mit festen Standardwerten ausgelegt, wird aber technisch so weiterentwickelt, dass später individuelle Reisen, Reisedauern, Paketpreise und Nutzerprofile sauber unterstützt werden können.

## Projektziel

Die App soll pro Nutzer den Getränkekonsum pro Tag zählen, mit echten Getränkedaten aus einer CSV bewerten und sichtbar machen, ob der rechnerische Tagesanteil des Getränkepakets bereits erreicht wurde.

Im Fokus stehen:
- schnelle mobile Erfassung mit wenigen Taps
- klare Tagesübersicht
- nachvollziehbare Summen und Fortschritte
- einfache lokale Nutzung auf dem eigenen Smartphone
- späterer Datenaustausch zwischen mehreren Teilnehmern

## Aktueller Stand

Die App kann:
- Getränke aus der CSV per Suche oder Favoriten buchen, Buchungen zurücknehmen
- Tage abschließen und wieder öffnen, Historie und Tageszusammenfassung anzeigen
- Tagesziel, Restbetrag und Gesamtbilanz gegen den Paketpreis berechnen
- Sondergetränke außerhalb des Pakets getrennt als Zuzahlung führen
- Reisedauer und Paketpreis im Profil einstellen
- Stände per QR-Code mit Mitreisenden vergleichen
- ohne Netz laufen und sich mit Netz selbst aktualisieren
- alle eigenen Daten als Datei sichern und wieder einspielen (Reiter Historie, Abschnitt Datensicherung)

Noch nicht umgesetzt:
- Auswahl des Pakets (All Inclusive oder Fun) beim Start einer Reise
- mehrere Reisen getrennt verwalten
- saubere Mehrnutzer-Struktur

## Testphase und spätere Live-Nutzung

### Test- und erste Produktionsphase

Für die aktuelle Testphase und die erste konkrete Nutzung bleiben diese festen Standardwerte erhalten:
- Reisedauer: 9 Tage
- Paketpreis: 240 Euro
- daraus resultierendes Tagesziel: 26,67 Euro

Diese festen Werte bleiben zunächst bewusst erhalten, damit die erste produktive Nutzung einfach und stabil bleibt.

### Späterer Live-Betrieb

Für den späteren finalen Live-Betrieb soll die App beim ersten Start bzw. beim Anlegen eines Profils zusätzliche Grunddaten erfassen:
- Kürzel oder Nutzername
- Avatar oder Profilkennzeichnung
- Reisedauer
- Paketpreis der Reise

Aus diesen Angaben soll die App dann das persönliche Tagesziel automatisch berechnen.

Perspektivisch soll außerdem möglich werden:
- neue Reisen anlegen
- Reisen getrennt verwalten
- je Reise eigene Dauer, Preise und Statistiken speichern

## Produktlogik

Die App basiert auf folgenden Grundannahmen:
- Getränkedaten liegen als UTF-8-CSV mit Semikolon vor
- die CSV enthält mindestens Name, Kategorie, Preis und Paket-/Modellinformationen
- Getränke werden per +1 erfasst
- jeder Teilnehmer nutzt sein eigenes Smartphone
- statt Klarnamen werden bevorzugt Kürzel und Avatare verwendet
- Datenaustausch erfolgt zunächst manuell und einfach nachvollziehbar

## Produktbereiche

Die App besteht mindestens aus diesen Kernbereichen:
- Tagesansicht / Tag
- Dashboard
- Historie

Diese Bereiche sollen als zusammenhängendes mobiles System wirken, nicht wie getrennte Einzelseiten.

## Nächste Entwicklungsschritte

Die Weiterentwicklung erfolgt bewusst in kleinen, kontrollierten Schritten.

### 1. Paket-Auswahl beim Start einer Reise
- All Inclusive oder Fun wählen; der Rechenkern unterstützt beide bereits
- Reisedauer und Paketpreis beim Start der Reise abfragen

### 2. Feedback der ersten Reise einarbeiten

### 3. Reisen und Nutzerprofil
- neue Reisen anlegen und getrennt verwalten, je Reise eigene Dauer, Preise und Statistiken
- lokales Profilmodell mit Kürzel, Avatar und Nutzer-ID

### 4. Mehrere Nutzer und Datenaustausch
- Daten pro Nutzer logisch trennen
- optionale Server-Synchronisierung nur als spätere Ausbaustufe

## Priorisierung

Für dieses Projekt gilt folgende Reihenfolge:
1. lokale Stabilität
2. Korrekturmechanismen wie Undo oder Reset
3. sauberes Tagesmodell
4. CSV-Anbindung
5. Mehrbenutzerfähigkeit
6. Datenaustausch / Synchronisierung
7. erst danach Vergleich, Gamification oder Medienfunktionen

## Technische Richtung

Die App soll bewusst einfach und wartbar bleiben:
- HTML, CSS und Vanilla JavaScript
- mobile-first
- Progressive Enhancement
- PWA: installierbar, offline nutzbar über einen Service Worker
- lokale Speicherung zunächst einfach und robust (`localStorage`), später optional IndexedDB
- keine Abhängigkeiten zur Laufzeit; Schriften und Bibliotheken liegen im Repo

Wichtige Architekturidee:
Das Datenmodell soll schon jetzt so vorbereitet werden, dass später nicht nur ein einzelner Reisetag, sondern Reisen, Tage, Nutzerprofile und Exporte logisch abgebildet werden können, ohne die aktuelle App unnötig zu verkomplizieren.

## Geplantes Datenmodell

Das Datenmodell soll perspektivisch folgende Bereiche sauber tragen:
- Reisen
- Reisedauer pro Reise
- Paketpreis pro Reise
- berechnetes Tagesziel
- Tage innerhalb einer Reise
- Getränkelog pro Tag
- Nutzerprofil mit Kürzel und Avatar
- später mehrere Nutzer
- Export- und Importdaten für Statistikabgleich

Für die aktuelle Testphase können weiterhin feste Startwerte verwendet werden, solange die Struktur später erweiterbar bleibt.

## Designprinzipien

Die Oberfläche soll:
- reduziert
- klar
- modern
- ruhig
- gut mobil bedienbar
- mit großen Touch-Flächen
- gut lesbar
- sachlich und hochwertig

Die App soll eher wie ein hochwertiger nautischer Concierge wirken als wie ein Standard-Finanztracker.

Vermeiden:
- generische KI-Optik
- unnötige Effekte
- überladene Dashboards
- unnötig komplexe Layouts ohne klaren Nutzen

## Refactoring-Regeln

Bei der Weiterentwicklung gilt:
- nicht blind neu generieren
- zuerst alle bereitgestellten Dateien analysieren
- DESIGN.md als primäre Designquelle behandeln
- vorhandene funktionierende Logik, Inhalte, IDs und Hooks möglichst erhalten
- inkrementell refaktorieren, nicht destruktiv
- JavaScript nur dann stärker umbauen, wenn Struktur- oder Datenmodelländerungen es erfordern
- auf Semantik, Accessibility, Responsive Design und Wartbarkeit achten

## Projektstruktur

Die konkrete Struktur kann sich im Refactoring noch verändern. Der aktuelle oder geplante Aufbau orientiert sich an einer einfachen statischen Web-App, z. B.:

```text
.
├── index.html
├── styles.css
├── app.js          # Oberfläche, Zustand, Speicherung
├── calc.js         # Rechenkern (reine Funktionen, im Browser und in Node nutzbar)
├── manifest.json
├── sw.js           # Service Worker: Offline-Betrieb und automatische Updates
├── data/
│   └── getraenke.csv
├── icons/          # App-Icons für den Startbildschirm
├── tests/          # Tests für Rechenkern und Getränkedaten
├── e2e/            # Browser-Test der Bedienabläufe (Playwright)
├── scripts/        # Hilfsskripte (Fingerabdruck für den Service Worker)
├── vendor/         # mitgelieferte Schriften und QR-Bibliotheken samt Lizenzen
├── package.json    # nur Befehle für Checks und Tests, keine Abhängigkeiten
├── assets/
└── README.md
```

## Tests

`npm test` prüft die Syntax und führt die Tests in `tests/` aus (Node ab Version 20, keine Abhängigkeiten).

Abgesichert sind:
- Tagesziel = Paketpreis / Reisetage, auf Cent gerundet (240 € / 9 Tage = 26,67 €)
- Tagessummen und Gesamtbeträge sowie die Checks dagegen (Fortschritt, Restbetrag, Ampel)
- Gesamtbilanz gegen den Paketpreis, nicht gegen die Summe der Tagesziele
- Sondergetränke außerhalb des Pakets: voller Preis als Zuzahlung, kein Beitrag zum Paket
- keine Division durch 0
- Getränkedaten: Schema, eindeutige IDs, gültige Preise und Kennzeichen

`npm run test:e2e` bedient die App in einem echten Browser (Chromium über Playwright): Getränke buchen, Sondergetränk, Favoriten, Rückgängig, Historie, Tagesabschluss, Dashboard, Profil-Prüfung, Vergleichstabelle, Speichern über einen Neustart und die Übernahme alter gespeicherter Daten. Einmalige Einrichtung: `npm install` und `npx playwright install chromium`. Dazu kommen der Start ohne Netz, das automatische Update auf eine neue Version und das Einlesen des eigenen QR-Codes. Mit `BROWSER=webkit npm run test:e2e` läuft derselbe Test mit der Technik von Safari (einmalig `npx playwright install webkit`). Anfragen an fremde Server lässt der Test nicht zu; Kamera und QR-Scan sind nicht abgedeckt.

`npm run test:all` führt beides aus.

Neue Rechenlogik gehört in `calc.js` und bekommt im selben Schritt Tests. Neue Bedienabläufe bekommen einen Fall in `e2e/app.e2e.js`.

## Offline-Betrieb und Updates

Die App funktioniert ohne Netz. Der Service Worker (`sw.js`) speichert beim ersten Öffnen alle Dateien auf dem Gerät; Schriften, Icons und QR-Bibliotheken liegen dafür in `vendor/` und werden nicht mehr von fremden Servern geladen.

- **Vor der Reise:** die App einmal mit Netz öffnen und zum Startbildschirm hinzufügen. Danach läuft sie offline.
- **Updates:** Beim Öffnen mit Netz prüft der Browser, ob es eine neue Version gibt. Sie wird im Hintergrund geladen, die Seite lädt sich einmal neu. Gespeicherte Buchungen bleiben erhalten.
- **Nach jeder Änderung an App-Dateien:** `npm run sw:version` ausführen und `sw.js` mit committen. Der Befehl erneuert den Fingerabdruck, an dem Geräte eine neue Version erkennen. `npm test` schlägt fehl, wenn er veraltet ist.
- **Neue Dateien**, die die App lädt, gehören in die Liste `PRECACHE` in `sw.js`; auch das prüft `npm test`.
- Die Daten liegen im Browser des Geräts und hängen an der Adresse der App. Ein Umzug auf eine andere Adresse nimmt sie nicht mit.

## Getränkedaten

`data/getraenke.csv` hat die Spalten `ID;Name;Typ;Preis NEU;Alkoholfrei;AI;F`.
- `ID`: eindeutig und stabil (`G0001` …). Bestehende IDs nie ändern oder neu vergeben; neue Getränke bekommen die nächste freie Nummer.
- `AI`: im Paket „All Inclusive" enthalten.
- `F`: im Paket „Fun" enthalten (alkoholfreie Getränke). Die Auswahl des Pakets beim Start einer Reise ist vorbereitet, aber noch nicht in der Oberfläche.

Wenn mehrere Screens oder ausgelagerte Module im Refactoring sinnvoll werden, kann diese Struktur später angepasst werden.

## Spätere Ausbaustufen

Nach den Kernfunktionen sind unter anderem denkbar:
- Vergleichsansichten zwischen Teilnehmern
- Reiseübersicht und Gesamtauswertung
- Favoriten und Häufigkeitsauswertung
- JSON-Export und Import
- QR-Code-basierter Datenaustausch
- optionale einfache Server-Synchronisierung
- behutsame Gamification
- optionale Medien- oder Sammelalbum-Funktionen

Diese Themen haben aber derzeit nachrangige Priorität gegenüber einer stabilen, klaren und gut wartbaren Kern-App.

## Entwicklungssetup

Empfohlenes lokales Setup:
- Visual Studio Code
- Live Server
- Git
- Browser-DevTools für mobile, PWA- und Offline-Tests

## Git-Hinweis

Das Repository kann in der frühen Phase privat bleiben. Das ist sinnvoll, solange Struktur, Datenmodell und Funktionsumfang noch aktiv weiterentwickelt werden.