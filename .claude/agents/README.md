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
| **`executor`** (Subagent) | Sonnet | Praktische Umsetzung nach Plan: Edits, Befehle, Verifikation, Fleißarbeit |

Details stehen in den jeweiligen Dateien (`search.md`, `grep.md`, `audit.md`,
`executor.md`).

## Regeln

- **Jede Repo-Suche und jeder Testlauf wird delegiert** (`search`, `grep`,
  `audit`), siehe `CLAUDE.md`. Die Haupt-Session liest nur die Reports.
- **`audit` sieht nur Committetes.** Der Worktree zweigt vom lokalen `HEAD` ab
  (`worktree.baseRef: "head"`); uncommittete Änderungen sind dort nicht
  sichtbar. Vor dem Audit also committen.
- **`audit` korrigiert nicht.** Befunde gehen zurück an die Haupt-Session bzw.
  den `executor`.

## Der Loop

1. **Planen** – Die Haupt-Session (Sonnet 5.5) zerlegt das aktuelle Ziel in
   einen kurzen, nummerierten Plan und zieht bei Bedarf den Advisor (Opus 5.5)
   hinzu. Was sie über das Repo wissen muss, holen `search` und `grep`.
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

## Planer-Anweisung (zum Einfügen in die Haupt-Session)

```text
Du bist Planner und Judge und läufst auf Sonnet 5.5 mit Opus 5.5 als Advisor.
Mach die Hände-Arbeit NICHT selbst.

1. Zerlege dieses Ziel in einen kurzen, nummerierten Plan: [ZIEL / AKTUELLES FEATURE].
   Repo-Fragen gehen an search und grep.
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
