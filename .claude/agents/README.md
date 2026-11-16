# Subagenten – Planner / Executor / Judge

Dieses Projekt trennt **Planung**, **Ausführung** und **Bewertung** auf zwei
Modell-Ebenen, um Qualität hochzuhalten und das Limit des teuren Modells zu
schonen. (Bild: Der Star-Architekt zeichnet die Pläne und nimmt den fertigen
Bau ab – der schnelle Junior mauert. Man bezahlt den Architekten nicht fürs
Mauern.)

| Rolle | Modell | Aufgabe |
|-------|--------|---------|
| **Planner + Judge** (Haupt-Agent) | Opus 4.8 oder Fable 5 | Aufgabe zerlegen, kurzen nummerierten Plan schreiben, jeden Schritt delegieren, nach jeder Runde gegen die Erfolgsbedingung prüfen und freigeben – plus nach-außen wirkende Schritte (Commit/Push/PR) |
| **`executor`** (Subagent) | Sonnet 5 | Die praktische Umsetzung: Edits, Befehle, Tests, Verifikation, wiederkehrende Fleißarbeit |

Details und Regeln des Executors stehen in `executor.md`.

## Der Loop

1. **Planen** – Der Planner (Opus/Fable) zerlegt das aktuelle Ziel in einen
   kurzen, nummerierten Plan.
2. **Delegieren** – Jeder Schritt geht an den `executor`-Subagenten (Sonnet).
   Der teure Denker tippt nicht selbst.
3. **Prüfen (Judge)** – Nach jeder Runde prüft der Planner: *Ist die
   Erfolgsbedingung erfüllt – ja oder nein?* Nur bei **ja** wird gestoppt.
4. **Zurückgeben** – Bei **nein** bekommt der Executor konkret gesagt, was zu
   korrigieren ist, und die nächste Runde startet.

Die anspruchsvolle Denkarbeit bleibt so auf dem stärksten Modell, die
mechanische Arbeit läuft effizient auf Sonnet.

## Das Ziel ist bewusst flexibel

Weil wir aktiv am Projekt weiterentwickeln, ist der **Zielabschnitt ein
Platzhalter, der pro Feature neu gefüllt wird**. Der Ablauf (planen → delegieren
→ prüfen → freigeben) bleibt gleich; nur Ziel und Erfolgsbedingung ändern sich
je nach anstehendem Feature.

## Erfolgsbedingung („Finish Line")

Immer etwas **maschinell Prüfbares** angeben, nicht „mach es gut":
- Tests grün / Lint sauber
- Datei existiert / Ausgabe entspricht der Spezifikation
- Seite verhält sich im Test wie beschrieben

Ohne prüfbares Ziel rät der Loop – er stoppt zu früh oder nie.

## Loop & Limit setzt der Benutzer

Ob und wie lange in einer Schleife gearbeitet wird, **entscheidet der Benutzer** –
insbesondere, wenn absehbar ist, dass die Umsetzung lange dauert. Der Agent
startet **keine** Dauerschleife von sich aus.

- **Lokal:** `/loop` wiederholt eine Aufgabe im Intervall auf dem eigenen Rechner
  (Rechner muss laufen). Kein bezahlter Plan nötig.
- **Cloud:** `/schedule` bzw. Routines laufen nach Zeitplan auf Anthropic-Servern,
  auch bei ausgeschaltetem Laptop – in der Regel nur mit bezahltem Plan.

Faustregel: lokal starten, erst in die Cloud gehen, wenn ein Job wirklich über
Nacht laufen muss.

## Planer-Anweisung (zum Einfügen in die Opus/Fable-Session)

```text
Du bist Planner und Judge und läufst auf Opus 4.8 (oder Fable 5).
Mach die Hände-Arbeit NICHT selbst.

1. Zerlege dieses Ziel in einen kurzen, nummerierten Plan: [ZIEL / AKTUELLES FEATURE].
2. Gib jeden Schritt zur Umsetzung an den executor-Subagenten.
3. Prüfe nach jeder Runde die Erfolgsbedingung und antworte ja oder nein.
4. Bei nein: sag dem executor genau, was zu korrigieren ist, dann nächste Runde.
   Stoppe nur bei ja.

Erfolgsbedingung: [KONKRETE, PRÜFBARE BEDINGUNG, z. B. alle Tests grün].
```

Fülle `[ZIEL / AKTUELLES FEATURE]` und `[KONKRETE, PRÜFBARE BEDINGUNG]` pro
Feature frisch aus. Wird die Umsetzung voraussichtlich lang, setzt der Benutzer
zusätzlich `/loop` (oder ein Limit) für die Runden.

## Pro-Tipps

- **Modell zur Aufgabe passend wählen:** Sonnet 5 für ordentliche Coding-Fleiß­
  arbeit; Haiku 4.5 für ganz einfaches, günstiges Grinden; Opus 4.8 / Fable 5
  nur für Planung und Bewertung.
- **Jeden Executor-Report kurz lesen** – der Fünf-Sekunden-Blick ist das Lenkrad
  und fängt einen Irrweg ab, bevor er zehn Runden kostet.
- **Modell eindeutig pinnen** (z. B. `model: claude-sonnet-5`), wenn es über
  Geräte/Teammitglieder hinweg keine Zweideutigkeit geben soll. Leeres
  `model`-Feld bedeutet `inherit` – dann läuft der Worker still auf dem teuren
  Hauptmodell.

Quelle: „FIX Guide – Make Claude's Best Models Last Twice as Long"
(Planner-Executor-Judge-Loop), an dieses Projekt angepasst.
