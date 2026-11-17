# Backlog

Vorgemerkte Ideen und Rückmeldungen. Status: offen = soll umgesetzt werden,
vorgemerkt = nur festgehalten, nicht umsetzen.

## 1. Buchungs-Rückmeldung verbessern (Feedback Reise 1)

Status: offen. Aufwand: klein bis mittel.

- Heute: Tap-Flash (0,1 s, `.tap-flash` in `styles.css`) und `navigator.vibrate(40)`.
- Problem: Auf dem iPhone (Hauptgerät, Safari/Home-Bildschirm-App) gibt es keine
  Vibration, und der Flash ist kaum wahrnehmbar.
- Kein Toast und kein Popup gewünscht (oft 2-3 Getränke hintereinander).
- Idee: Kachel deutlich länger einfärben (ca. 0,5 s länger), ggf. Betrag kurz
  hochzählen.
- Zu beachten: Die Favoriten-Kachel entfernt die Flash-Klasse nicht (`app.js`
  ca. Zeilen 393-401); `prefers-reduced-motion` fehlt.

## 2. Reisetage / Abreisetag

Status: offen, braucht zuerst ein eigenes Konzept. Aufwand: mittel bis groß.

- AIDA nennt "14 Tage" für 23.01.27-06.02.27, effektiv sind es 14 Nächte.
- An- und Abreisetag sollen als ein Tag zählen, alle Getränke sauber getrackt
  werden; das Paket darf nicht auf 15 Tage gerechnet werden, und am Abreisetag
  darf kein voller Tagesbetrag erwartet werden.
- Heute: kein Datum, nur Tageszähler; `day > duration` wird nirgends geprüft.
- Optionen:
  - (a) Tageszähler bei `duration` deckeln.
  - (b) Extra-Resttag mit Tagesziel 0, nur Gesamtbilanz.
  - (c) Start-/Enddatum im Profil, An-/Abreise zusammen als ein Tag.
- Nutzerpräferenz: (b) oder (c).

## 3. Mehr Auswertungen

Status: offen, Konzept zuerst.

- Feedback eines Mitreisenden: nur "Mehr Auswertungen". Unklar, ob Dashboard
  oder gamifizierte/lustige grafische Auswertungen statt Tabellen gemeint sind
  (Getränke, Uhrzeit, pro Tag, alkoholisch/alkoholfrei, Zuzahlung).
- Die Daten reichen (Zeitstempel, ID, Preis pro Buchung).
- Auswertung über den Buchungs-Zeitstempel, nicht über `day.date` (in Altdaten
  unzuverlässig).
- Grafiken ohne Fremdserver; eine Bibliothek käme nach `vendor/` mit
  Lizenzangabe in `vendor/README.md` (keine GPL).

## 4. Gamification

Status: vorgemerkt (nicht umsetzen).

- Mehr Animationen beim Buchen und bei erreichtem Tagesziel.
- "Tagesziel erreicht" ist heute nur ein Zustand, kein Ereignis
  (`undoLastDrink` kann ihn aufheben). Für einen einmaligen Effekt ist ein
  Vorher-Nachher-Vergleich in `addDrink` (`app.js` ca. Zeilen 147-163) nötig.

## Erledigt

- Suchleiste vor Favoriten (Tag-Reiter).
- Ringe über 100 % (Apple-Aktivitätsringe-Stil): zweite Runde, ungedeckelter
  Prozentwert im Dashboard-Badge.
