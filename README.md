# AIDA Drink Tracker

Kleine mobile Web-App bzw. perspektivisch PWA zur Erfassung des täglichen Getränkekonsums auf Reisen mit Getränkepaket.

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

Die bestehende Version 1 kann bereits:
- Getränke hinzufügen
- Getränke reduzieren
- neue Tage starten
- echte Anbindung der CSV-Datenquelle

Damit ist eine erste lokale Basis zum täglichen Tracking vorhanden.

Noch nicht vollständig umgesetzt sind derzeit:
- saubere Mehrnutzer-Struktur
- Datenaustausch zwischen Geräten
- konsolidierte Weiterentwicklung aller Screens nach dem verbindlichen Designsystem

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

### 1. Codebasis konsolidieren
- bestehende HTML-, CSS- und JS-Struktur analysieren
- funktionierende Logik erhalten
- wiederkehrende UI-Bausteine vereinheitlichen
- Tagesansicht, Dashboard und Historie zu einem konsistenten System zusammenführen

### 2. Designsystem verbindlich anwenden
- Farben, Surfaces, Typografie, Komponentenstil, Abstände und Navigation konsistent übernehmen
- wiederkehrende Elemente wie Header, KPI-Karten, Suchfeld, Kategorien, Listen, Summary-Blöcke und Bottom Navigation angleichen

### 3. Datenmodell stabilisieren
- aktuelles Datenmodell dokumentieren
- prüfen, ob es Tageswechsel, Undo, CSV-Anbindung, Profil, Reise, Export und spätere Synchronisierung sauber tragen kann
- falls nötig, kleine nachvollziehbare Refaktorierungen vornehmen

### 4. CSV-Datenquelle anbinden
- echte Getränkedaten aus CSV einlesen
- harte Testdaten schrittweise ersetzen
- Namen, Kategorien, Preise und Paketinformationen aus der CSV speisen

### 5. Nutzerprofil vorbereiten
- lokales Profilmodell mit Kürzel, Avatar und Nutzer-ID vorbereiten
- Onboarding für spätere Versionen mit Reisedauer und Paketpreis mitdenken
- in der Testphase weiterhin mit den festen Standardwerten 9 Tage / 240 Euro arbeiten

### 6. Mehrere Nutzer und Datenaustausch vorbereiten
- Daten pro Nutzer logisch trennen
- JSON-Export der Statistikdaten vorbereiten
- QR-Code-basierten Austausch als einfache Offline-/Low-Tech-Option mitdenken
- optionale spätere Server-Synchronisierung nur als spätere Ausbaustufe vorsehen

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
- perspektivisch PWA
- lokale Speicherung zunächst einfach und robust
- später optional IndexedDB und Service Worker, falls für den tatsächlichen Entwicklungsstand sinnvoll

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
├── app.js
├── manifest.json
├── sw.js
├── data/
│   └── getraenke.csv
├── assets/
└── README.md
```

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