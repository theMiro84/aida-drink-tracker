# CLAUDE.md

- Delegiere jede Repo-Suche und jeden Testlauf an die Haiku-5.5-Subagenten
  (`search` für Struktur, `grep` für Aufrufstellen, `audit` für Diff-Checks und
  Testläufe), um den Hauptkontext klein zu halten.
- Neue oder geänderte Rechenlogik gehört in `calc.js` und bekommt im selben
  Schritt Tests in `tests/`; neue Bedienabläufe einen Fall in `e2e/app.e2e.js`.
  Ohne passende Tests gilt eine Änderung als nicht fertig.
- Consult the advisor before locking a plan, after the same error twice, and
  before calling a task done.
