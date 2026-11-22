# Mitmachen · Contributing

Danke fürs Interesse! Baby Time ist ein kleines Hobbyprojekt. Issues und Pull Requests sind willkommen, auf Deutsch oder Englisch.

## Bevor du anfängst

- **Fehler und Ideen** zuerst als [Issue](../../issues/new/choose) melden. Bei größeren Änderungen bitte erst fragen, bevor du Zeit investierst: Die App bleibt bewusst klein (siehe `spec.md` §2, „Nicht im Umfang“).
- **Keine Gesundheitsdaten** und keine echten Babynamen in Issues, Screenshots oder Testdaten.
- **Sicherheitslücken** nicht öffentlich melden, siehe [SECURITY.md](SECURITY.md).

## Regeln im Code

- Die App macht **keine Netzwerkaufrufe** außer ihren eigenen Dateien. Keine Tracker, keine CDNs, keine externen Schriften (`npm run check:external` prüft das).
- **Alle Texte** stehen in `src/strings.de.ts` und `src/strings.en.ts` mit denselben Schlüsseln. Neue Texte immer in beiden Sprachen.
- Zugriff auf die Datenbank nur in `src/data/` (Lint-Regel).
- Neue Version: `package.json` erhöhen **und** einen Eintrag oben in `src/changelog.ts` (Deutsch und Englisch). Neue Funktionen bekommen dort eine kurze Anleitung (`guide`).
- Entscheidungen, die vom Auftrag abweichen, kurz in `DECISIONS.md` begründen.

## Prüfen

```
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

Details in [docs/ENTWICKLUNG.md](docs/ENTWICKLUNG.md). Jeder Pull Request läuft automatisch durch dieselben Prüfungen (GitHub Actions, Workflow „CI“). Ausgeliefert wird nur, was auf `main` gemergt ist.

## Lizenz

Mit einem Beitrag stimmst du zu, dass er unter der [MIT-Lizenz](LICENSE) des Projekts veröffentlicht wird.
