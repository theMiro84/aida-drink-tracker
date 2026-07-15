# Subagenten – Konzept

Dieses Projekt trennt **Planung** und **Ausführung** auf zwei Ebenen, um
Qualität und Kosten auszubalancieren:

| Rolle | Modell | Aufgabe |
|-------|--------|---------|
| **Haupt-Agent (Planner)** | Opus 4.8 oder Fable | Analyse, Architektur, Plan, Priorisierung, Reviews, nach-außen wirkende Schritte (Commit/Push/PR) |
| **`executor` (Subagent)** | Sonnet | Umsetzung klar umrissener Aufgaben: Code, Tests, Verifikation, kleine Refactorings |

## Idee

Der teure, stärker denkende Haupt-Agent (Opus/Fable) entscheidet **was** und
**warum**. Die konkrete, gut spezifizierte Umsetzung – das **wie** – delegiert
er an den `executor`-Subagenten auf Sonnet: schnell, konventionstreu, ohne
eigene Architekturentscheidungen. Stößt der Executor auf eine offene Frage,
meldet er sie zurück, statt zu raten.

So bleibt die anspruchsvolle Denkarbeit auf dem stärksten Modell, während die
mechanische Fleißarbeit effizient und günstig auf Sonnet läuft.

## Nutzung

Der Haupt-Agent delegiert über das Agent-Tool mit `subagent_type: "executor"`
und übergibt einen präzisen Auftrag (Plan/Spezifikation). Details und Regeln des
Executors stehen in `executor.md`.

> Hinweis: Diese Fassung ist eine Basis nach der mündlichen Beschreibung. Sie
> soll noch mit der ausführlichen Konzeptbeschreibung aus der Typst-Editor-
> Session abgeglichen werden.
