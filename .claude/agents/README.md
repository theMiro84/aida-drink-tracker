# Subagenten – Haupt-Session, Advisor und Haiku-Helfer

Dieses Projekt verteilt die Arbeit auf drei Modell-Ebenen, um den Kontext der
Haupt-Session klein und die Kosten niedrig zu halten. Die Modelle sind in
`.claude/settings.json` und im Frontmatter der Agenten-Dateien gepinnt.

| Rolle | Modell | Aufgabe |
|-------|--------|---------|
| **Haupt-Session** (Planner + Judge) | Sonnet 5.5 | Aufgabe zerlegen, kurzen nummerierten Plan schreiben, delegieren, nach jeder Runde gegen die Erfolgsbedingung prüfen – plus nach außen wirkende Schritte (Commit/Push/PR) |
| **Advisor** | Opus 5.5 | Wird von der Haupt-Session bei Planung, unklaren Fehlern und Abnahme hinzugezogen (`advisorModel`). Wann, entscheidet die Haupt-Session; erzwingen lässt es sich nicht |
| **`search`** (Subagent) | Haiku 5.5 | Repo kartieren: Struktur, Dateien, Einstiegspunkte. Nur lesend |
| **`grep`** (Subagent) | Haiku 5.5 | Aufrufstellen und Verwendungen eines Symbols finden. Nur lesend |
| **`audit`** (Subagent) | Haiku 5.5 | Committeten Diff prüfen, Checks und Testläufe ausführen – isoliert im eigenen Worktree |
| **`executor`** (Subagent) | Sonnet 5.5 | Praktische Umsetzung nach Plan: Edits, Befehle, Verifikation, Fleißarbeit |

Details stehen in den jeweiligen Dateien (`search.md`, `grep.md`, `audit.md`,
`executor.md`).

## Modell-Updates

Alle Modelle sind mit voller ID gepinnt, damit es keine stillen Wechsel gibt.
Bei einer neuen Modellgeneration müssen diese Stellen **gemeinsam** angepasst
werden:

| Stelle | Feld | Aktuell |
|--------|------|---------|
| `.claude/settings.json` | `model` | `claude-sonnet-5-5` |
| `.claude/settings.json` | `advisorModel` | `claude-opus-5-5` |
| `.claude/agents/search.md`, `grep.md`, `audit.md` | `model` | `claude-haiku-5-5` |
| `.claude/agents/executor.md` | `model` | `claude-sonnet-5-5` |
| diese Datei, `executor.md`, `CLAUDE.md` | Modellnamen im Text | Sonnet 5.5, Opus 5.5, Haiku 5.5 |

Dabei gilt:
- Der Advisor muss stärker sein als das Hauptmodell, die Helfer günstiger.
- Nach der Änderung in einer neuen Session mit `/model` und `/advisor` prüfen,
  ob die Einstellungen greifen, und einmal `audit` laufen lassen.
- `npm test` prüft, dass überall volle Modell-IDs stehen und dass die Tabelle
  oben zu den Dateien passt. Ob ein Modell noch angeboten wird, prüft der Test
  nicht.

## Regeln

- **Advisor hinzuziehen:** bevor ein Plan festgelegt wird, nach demselben
  Fehler zum zweiten Mal und bevor eine Aufgabe als erledigt gemeldet wird
  (siehe `CLAUDE.md`).
- **Erst die Repo-Karte, dann gezielt lesen.** Die Karte steht in `CLAUDE.md`
  (Abschnitt „Aufbau“) und wird bei jeder Session automatisch geladen. Was
  dort steht, liest die Haupt-Session direkt; ein Scan zu Beginn entfällt.
- **Delegiert werden nur breite Fragen und Testläufe:** `search`, wenn die
  Karte nicht reicht oder veraltet wirkt; `grep` für vollständige Listen von
  Aufrufstellen über mehrere Dateien; `audit` für jeden Testlauf. Grund: Das
  Repo ist klein. Ein Subagent startet ohne Vorwissen und braucht länger als
  ein direkter Blick in eine bekannte Datei. Wächst das Repo deutlich, wird
  die Regel wieder verschärft.
- **Die Karte bleibt aktuell.** Neue Datei, neuer Ordner oder neuer Bereich:
  Karte im selben Commit anpassen. `tests/config.test.js` schlägt fehl, wenn
  eine Datei oder ein Ordner in der Karte fehlt.
- **`audit` sieht nur Committetes.** Der Worktree zweigt vom lokalen `HEAD` ab
  (`worktree.baseRef: "head"`); uncommittete Änderungen sind dort nicht
  sichtbar. Vor dem Audit also committen.
- **Neue Funktionen werden abgesichert.** Neue oder geänderte Rechen- und
  Auswertungslogik gehört in `calc.js` und bekommt im selben Schritt Tests in
  `tests/`; neue Bedienabläufe bekommen einen Fall im Browser-Test
  `e2e/app.e2e.js`. `audit` führt `npm test` und bei Änderungen an der
  Oberfläche `npm run test:e2e` aus und meldet fehlende Tests als Befund.
- **`audit` korrigiert nicht.** Befunde gehen zurück an die Haupt-Session bzw.
  den `executor`.

## Der Loop

1. **Planen** – Die Haupt-Session (Sonnet 5.5) zerlegt das aktuelle Ziel in
   einen kurzen, nummerierten Plan und zieht bei Bedarf den Advisor (Opus 5.5)
   hinzu. Was sie über das Repo wissen muss, steht in der Repo-Karte in
   `CLAUDE.md`; nur breite Fragen gehen an `search` und `grep`.
2. **Delegieren** – Umsetzungsschritte gehen an den `executor`.
3. **Prüfen (Judge)** – Nach dem Commit prüft `audit` den Diff. Die
   Haupt-Session entscheidet: *Ist die Erfolgsbedingung erfüllt – ja oder nein?*
   Nur bei **ja** wird gestoppt.
4. **Zurückgeben** – Bei **nein** bekommt der Executor konkret gesagt, was zu
   korrigieren ist, und die nächste Runde startet.

## Das Ziel ist bewusst flexibel

Weil wir aktiv am Projekt weiterentwickeln, ist der **Zielabschnitt ein
Platzhalter, der pro Feature neu gefüllt wird**. Der Ablauf (planen → delegieren
→ prüfen → freigeben) bleibt gleich; nur Ziel und Erfolgsbedingung ändern sich
je nach anstehendem Feature.

## Erfolgsbedingung („Finish Line")

Immer etwas **maschinell Prüfbares** angeben, nicht „mach es gut":
- `npm test` grün
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

## Planer-Anweisung (zum Einfügen in die Haupt-Session)

```text
Du bist Planner und Judge und läufst auf Sonnet 5.5 mit Opus 5.5 als Advisor.
Mach die Hände-Arbeit NICHT selbst.

1. Zerlege dieses Ziel in einen kurzen, nummerierten Plan: [ZIEL / AKTUELLES FEATURE].
   Orientiere dich an der Repo-Karte in CLAUDE.md und lies bekannte Dateien
   direkt; nur breite Repo-Fragen gehen an search und grep.
2. Gib jeden Schritt zur Umsetzung an den executor-Subagenten.
3. Lass nach jeder Runde audit den committeten Diff prüfen, bewerte die
   Erfolgsbedingung und antworte ja oder nein.
4. Bei nein: sag dem executor genau, was zu korrigieren ist, dann nächste Runde.
   Stoppe nur bei ja.

Erfolgsbedingung: [KONKRETE, PRÜFBARE BEDINGUNG, z. B. alle Tests grün].
```

Fülle `[ZIEL / AKTUELLES FEATURE]` und `[KONKRETE, PRÜFBARE BEDINGUNG]` pro
Feature frisch aus. Wird die Umsetzung voraussichtlich lang, setzt der Benutzer
zusätzlich `/loop` (oder ein Limit) für die Runden.

## Pro-Tipps

- **Modell zur Aufgabe passend wählen:** Haiku 5.5 für Suchen, Aufrufstellen
  und Checks; Sonnet für Planung, Bewertung und Umsetzung; Opus 5.5 nur als
  Advisor für die schwierigen Entscheidungen.
- **Jeden Executor-Report kurz lesen** – der Fünf-Sekunden-Blick ist das Lenkrad
  und fängt einen Irrweg ab, bevor er zehn Runden kostet.
- **Modell eindeutig pinnen** (z. B. `model: claude-haiku-5-5`), wenn es über
  Geräte/Teammitglieder hinweg keine Zweideutigkeit geben soll. Leeres
  `model`-Feld bedeutet `inherit` – dann läuft der Worker still auf dem teuren
  Hauptmodell.

Quelle: „FIX Guide – Make Claude's Best Models Last Twice as Long"
(Planner-Executor-Judge-Loop), an dieses Projekt angepasst.
