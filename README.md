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
- Progressbalken als zusätzliche visuelle Anzeige zum Tagesziel
- Lokale Datenspeicherung direkt im Browser
- Mobile Nutzung auf iPhone und Android
- Default-Icon pro Getränkekategorie

### Version 2

- Übersichtsseite mit Gesamtsummen
- Vergleich zwischen Teilnehmern
- Export und Import von Datenständen
- Individuelle Paketpreise pro Teilnehmer oder pro Reiseabschnitt, falls Getränkepakete an Bord nachgebucht oder geändert werden
- Einfache Vergleichs- und Rankinglogik
- Erste Scores und Awards zur spielerischen Motivation

### Spätere Versionen

- Unterstützung weiterer Reisen mit anderen Paketpreisen und Teilnehmern
- Erweiterte Gamification mit mehreren Scores, Awards, Sammelzielen und Tages-/Reise-Challenges
- Hochladen von Getränkebildern oder Erlebnisbildern im Stil eines kleinen Panini-Sammelalbums
- Freigabe ausgewählter Bilder an andere Teilnehmer
- Bildoptimierung vor dem Speichern oder Teilen, z. B. kleinere Auflösung, Komprimierung und begrenzte Dateigröße
- Einfache Synchronisierung von Bild- und Getränkedaten zwischen Teilnehmern

## Technische Richtung

Die erste Version soll bewusst einfach bleiben:

- HTML, CSS und JavaScript ohne Framework
- Progressive Web App (PWA)
- Lokale Speicherung mit IndexedDB
- Offline-Unterstützung mit Service Worker
- Statische Bereitstellung über normalen Webspace

Für spätere Versionen zusätzlich mitdenken:
- Datenmodell so aufbauen, dass pro Teilnehmer eigene Paketpreise und Paketänderungen gespeichert werden können
- Medienverwaltung nur mit reduzierter Dateigröße und begrenzter Auflösung
- Datenaustausch zunächst manuell, später optional teilautomatisiert

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
- visuelle Statusanzeigen durch Ampel und Progressbalken
- sinnvolle Icons statt unnötiger visueller Überladung

## Erweiterte Produktideen

### Status und Motivation

- Ampelstatus für das Tagesziel
- Progressbalken für den aktuellen Tagesfortschritt
- Tages-, Wochen- oder Reise-Scores
- Awards wie z. B. „Cocktail-Kenner", „Softdrink-Profi“ oder „Paket-Mathematiker"
- kleine Vergleichs- oder Sammelmechaniken ohne übertriebene Komplexität

### Medien und Sammelalbum

- Teilnehmer können Bilder zu Getränken oder besonderen Funden hochladen
- Bilder sollen ähnlich wie ein kleines digitales Sammelalbum funktionieren
- Freigegebene Bilder können auch bei anderen Teilnehmern angezeigt werden
- Vor Speicherung oder Übertragung müssen Bilder verkleinert und komprimiert werden, damit Speicherbedarf und Datentransfer begrenzt bleiben
- Bildnutzung soll optional sein und die Kernfunktion der App nicht blockieren

## Entwicklungssetup

Empfohlenes lokales Setup:
- Visual Studio Code
- Live Server
- Git
- Chrome oder Edge DevTools für PWA- und Offline-Tests

## Projektplan

### Phase 1 – Grundfunktion

1. CSV-Struktur prüfen und Datenmodell festlegen
2. Basis-UI für eine Person und einen Reisetag bauen
3. Preisberechnung und Tagesziel integrieren
4. Ampelanzeige und Progressbalken ergänzen
5. Favoriten-Buttons ergänzen
6. Default-Icons pro Kategorie anzeigen

### Phase 2 – Lokale Nutzung stabilisieren

1. Lokale Speicherung einbauen
2. Tagesdaten beim Neuladen wiederherstellen
3. Mobile Bedienung testen
4. PWA-Grundlage mit Manifest und Service Worker ergänzen
5. Offline-Fähigkeit testen

### Phase 3 – Gruppenfunktionen

1. Export und Import von Datenständen ergänzen
2. Vergleichs- und Übersichtsseite ergänzen
3. Einfache Ranking-Logik einführen
4. Individuelle Paketpreise und spätere Nachbuchungen im Datenmodell berücksichtigen

### Phase 4 – Gamification

1. Scores definieren
2. Awards und kleine Challenges einbauen
3. Sichtbare Belohnungen und Sammelelemente gestalten
4. Darauf achten, dass Gamification die Kernnutzung ergänzt, aber nicht überlagert

### Phase 5 – Medienfunktionen

1. Bild-Upload lokal ermöglichen
2. Bilder beim Upload automatisch verkleinern und komprimieren
3. Bilder an Getränke oder Kategorien binden
4. Bilder in einer Sammelalbum-Ansicht darstellen
5. Freigabe und Anzeige bei anderen Teilnehmern über einfache Datenaustauschmechanismen ermöglichen

## Technische Leitplanken für spätere Features

- Bilder nie in voller Handy-Auflösung speichern oder übertragen
- Vor Speicherung Zielgröße und Qualitätsstufe definieren
- Medien nur ergänzend einsetzen, damit die App schnell und offline-fähig bleibt
- Neue Features immer so schneiden, dass zuerst eine kleine nutzbare Version entsteht
- Komplexität bei Synchronisierung bewusst niedrig halten

## Git-Hinweis

Das Repository kann zunächst privat bleiben. Für die frühe Projektphase ist das sinnvoll, weil Struktur, Datenmodell und Umfang sich noch ändern können.
