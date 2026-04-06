# AIDA Drink Tracker

Kleine offline-fähige Browser-App zur Erfassung des täglichen Getränkekonsums auf einer 9-tägigen Reise.

## Ziel des Projekts

Die App soll pro Teilnehmer den Getränkekonsum pro Tag zählen, mit einer hinterlegten Preistabelle bewerten und sichtbar machen, ob der rechnerische Tagesanteil des All-Inclusive-Getränkepakets bereits erreicht wurde.

Grundlage für die erste Version:
- Paketpreis: 240 Euro für 9 Tage
- Tagesziel: 26,67 Euro pro Tag
- Zählweise: Getränke werden mit +1 erfasst
- Teilnehmer: bis zu 4 Personen
- Bedienung: jedes Mitglied verwendet sein eigenes Smartphone
- Datenaustausch: manuelles Zusammenführen am Abend oder nach einigen Tagen
- Namen: Kürzel und Avatare statt Klarnamen
- Einsatz: zunächst für eine einzelne Reise

## Geplanter Funktionsumfang

### Version 1

- Getränkeliste aus CSV laden oder in App-Daten überführen
- Getränke nach Name, Kategorie und Preis verwalten
- Kennzeichnung, in welchem All-Inclusive-Modell ein Getränk enthalten ist
- Tageserfassung pro Teilnehmer
- Bis zu vier Favoriten-Getränke für schnelles Tippen
- Summenberechnung pro Tag
- Ampelanzeige für den Tagesfortschritt
- Lokale Datenspeicherung direkt im Browser
- Mobile Nutzung auf iPhone und Android

### Spätere Versionen

- Übersichtsseite mit Gesamtsummen
- Vergleich zwischen Teilnehmern
- Export und Import von Datenständen
- Unterstützung weiterer Reisen mit anderen Paketpreisen und Teilnehmern

## Technische Richtung

Die erste Version soll bewusst einfach bleiben:

- HTML, CSS und JavaScript ohne Framework
- Progressive Web App (PWA)
- Lokale Speicherung mit IndexedDB
- Offline-Unterstützung mit Service Worker
- Statische Bereitstellung über normalen Webspace

## Projektstruktur

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

## Designprinzipien

Die Oberfläche soll sich an reduziertem, klarem, mobilem App-Design orientieren:
- ruhige, aufgeräumte Oberfläche
- große Touch-Flächen
- einfache Erfassung mit wenigen Taps
- gut lesbare Summen und Statusanzeigen
- klare Trennung zwischen heute, Verlauf und Übersicht

## Entwicklungssetup

Empfohlenes lokales Setup:
- Visual Studio Code
- Live Server
- Git
- Chrome DevTools für PWA- und Offline-Tests

## Nächste Schritte

1. CSV-Struktur prüfen und Datenmodell festlegen
2. Basis-UI für eine Person und einen Reisetag bauen
3. Preisberechnung und Tagesziel integrieren
4. Favoriten-Buttons ergänzen
5. Lokale Speicherung einbauen
6. Offline-Fähigkeit als PWA aktivieren
7. Vergleichs- und Übersichtsseite ergänzen

## Git-Hinweis

Das Repository kann zunächst privat bleiben. Für die frühe Projektphase ist das sinnvoll, weil Struktur, Datenmodell und Umfang sich noch ändern können.