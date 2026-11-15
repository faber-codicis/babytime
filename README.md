# Baby Time

PWA zum Mitschreiben von Stillen, Windeln und Schlaf – einhändig, offline, ohne Konto. Testversion 0.14.0 (Beta, Deutsch und Englisch).

**Datenschutz:** Alle Einträge bleiben auf dem Gerät. Es gibt keinen Upload, keine Weitergabe, keine Analyse.

## Was die App kann

- **Heute:** zuletzt gestillt, nächste Seite, letzte Windel, Schlaf, Tageszähler. Stillen mit Timer und Seitenwechsel, Windel in 2 Taps, Schlaf in 1 Tap, Flasche und Abpumpen mit Menge, jeweils mit „Rückgängig“.
- **Verlauf:** Liste nach Tagen, Einträge ändern, löschen und nachtragen.
- **Meilensteine** (eigener Tab, abschaltbar) und **Wochenansicht** im Verlauf.
- **Erststart** mit Babyname und Geburtsdatum (beides freiwillig).
- **Einstellungen** (eigener Tab): Profil, **Was möchtest du festhalten?** (Stillen, Flasche, Abpumpen, Windel, Schlaf einzeln an/aus), **Zeitleiste** an/aus, **Dunkles Design** ein/aus oder **Nachts automatisch** (20–7 Uhr, mit Nachtansicht auf Heute; Standard: hell), **Akzentfarbe** (Rosé, Grün, Lila, Blau, Orange), **Sprache · Language** (Automatisch, Deutsch, English), Sicherung exportieren (mit „Letzte Sicherung: vor x Tagen“) und wiederherstellen, alle Daten löschen, Version mit **Nach Update suchen**, „Was ist neu“, **Feedback senden** (E-Mail-Entwurf an `kontakt@mraz.app` mit Version und Gerät, keine Einträge), Installationshinweis, Hinweise zu Datenschutz, Testversion und „kein medizinischer Rat“.
- **Sicherungs-Erinnerung** auf Heute, wenn die letzte Sicherung zwei Wochen her ist.
- **Update-Hinweis:** Nach einer neuen Version erscheint einmal ein Popup mit den Neuerungen.

## Start

Voraussetzung: Node.js (getestet mit 26) und npm.

```
npm ci            # Abhängigkeiten genau nach package-lock.json installieren
npm run dev       # Entwicklung: http://localhost:5173 (ohne Service Worker)
npm run build     # fertige App nach dist/
npm run preview   # gebaute App: http://localhost:4173 (mit Service Worker und CSP)
```

## Prüfen und testen

| Befehl | Was es tut |
| --- | --- |
| `npm run typecheck` | TypeScript-Prüfung |
| `npm run lint` | ESLint, inkl. Verbot von `innerHTML`, `dangerouslySetInnerHTML`, `eval` und direktem Datenbankzugriff aus der UI |
| `npm test` | Unit-Tests (Datenregeln, Zeit-Logik, Tageszähler, Import-Prüfung, Versionsvergleich, Lint-Regeln) |
| `npm run test:e2e` | Playwright in Chrome (Android-Ersatz) und WebKit (Safari-Engine), Port 4318 |
| `npm run check:external` | prüft nach dem Build, dass `dist/` keine externen URLs enthält |
| `npm run snapshot` | lokale Sicherung nach `../babytime-snapshots/` (die letzten 20 bleiben) |
| `npm run icons` | erzeugt die App-Icons aus `src/assets/logo.svg` neu |

Beim ersten Mal für Playwright einmalig: `npx playwright install chromium webkit`.

Der Code liegt auf GitHub (`faber-codicis/babytime`); `npm run snapshot` bleibt als zusätzliche lokale Sicherung. Geheimnisse (`.env*`, `.dev.vars*`, `.wrangler/`) sind per `.gitignore` ausgeschlossen.

Die E2E-Tests laufen unabhängig von der Zeitzone des Rechners immer in `Europe/Vienna` (gesetzt in `playwright.config.ts`).

## Auf dem Handy testen

Service Worker und Installation brauchen einen sicheren Kontext (HTTPS oder `localhost`). Eine Adresse wie `http://192.168.x.x:5173` im WLAN genügt dafür **nicht**.

| Ziel | Weg |
| --- | --- |
| Layout und Bedienung schnell prüfen | `npm run dev -- --host`, Handy im selben WLAN. Offline und Installation sind so nicht testbar. |
| Offline und PWA auf Android | USB-Debugging mit Port-Forwarding (`chrome://inspect`), dann ist `localhost` auf dem Handy erreichbar. |
| Offline und Installation auf dem iPhone | `npm run build && npm run preview -- --host` hinter einem HTTPS-Tunnel (z. B. Cloudflare Tunnel) oder die nicht beworbene `*.workers.dev`-Adresse (siehe unten). |
| Beta-Test | Cloudflare (siehe unten); Adresse nur an Testerinnen und Tester geben. |

**iPhone (iOS 26):** Link in Safari öffnen – oben erscheint die Karte „Als App installieren“ mit denselben Schritten:

1. Auf **•••** tippen.
2. **Teilen** → **„Zum Home-Bildschirm“**.
3. **„Als Web-App öffnen“** eingeschaltet lassen → **„Hinzufügen“**.

Danach die App vom Home-Bildschirm starten, Flugmodus an, App ganz schließen und neu starten: Sie muss mit allen Funktionen laufen. Bitte immer die installierte App verwenden, nicht den Safari-Tab – Safari kann Daten von nicht installierten Seiten nach längerer Nichtnutzung löschen. Die Menünamen sind ohne echtes iPhone formuliert; weichen sie ab, Text in `src/strings.de.ts` (`installHint`) und `spec.md` §6.7 anpassen.

**Android (Chrome):** Link öffnen → oben erscheint „Als App installieren“ mit Button **Installieren** (sobald Chrome die Installation anbietet), sonst Menü **⋮** → **„App installieren“**. Danach wie oben offline testen.

Oben rechts auf **Heute** steht die Versions-Pille „vx.y.z“; antippen zeigt Datum und Uhrzeit des Builds. Nach einem Upload: Pille antippen → **Nach Update suchen**. Sobald die neue Version geladen ist, wird die Pille zu **Update bereit** – antippen startet sie. Ohne Antippen übernimmt die App sie beim nächsten Start.

## Erster Start bei Testerinnen und Testern (Checkliste)

1. Link in **Safari** öffnen, App wie oben installieren, dann **nur noch vom Home-Bildschirm** starten.
2. Erststart: Name und Geburtsdatum eintragen oder „Ohne Namen fortfahren“.
3. Einmal Flugmodus an, App neu starten – alles muss gehen.
4. Testeinträge vom Ausprobieren entfernen: **Einstellungen** → **Alle Daten löschen**.
5. Ab und zu sichern: **Einstellungen** → **Daten exportieren** → „In Dateien sichern“ (oder „Jetzt sichern“ auf der Erinnerungskarte). Die Datei ist unverschlüsselt (oder „Mit Passwort exportieren“); nach einem Wiederherstellen löschen.
6. Fehler und Ideen: **Einstellungen** → **Feedback senden**. Das öffnet einen E-Mail-Entwurf mit Version und Gerät; gesendet wird erst nach eigenem Tippen auf Senden. Bildschirmfotos helfen, Gesundheitsdaten bitte nicht mitschicken.

## Beta-Test

- Feedback kommt per E-Mail an `kontakt@mraz.app` (Adresse in `src/ui/feedback.ts`). Die Weiterleitung ist laut Cloudflare aktiv; vor dem ersten Tester einmal selbst eine Feedback-Mail schicken.
- Tester brauchen nur die Adresse der App, kein GitHub-Zugang.
- Sprache: Deutsch für Handys mit Sprache `de-*`, sonst Englisch; in den Einstellungen umschaltbar. Texte in `src/strings.de.ts` und `src/strings.en.ts` (gleiche Schlüssel, per Typprüfung und Unit-Test erzwungen), Neuerungen zweisprachig in `src/changelog.ts`.
- Neue Funktionen bekommen in `src/changelog.ts` eine `guide` (nummerierte Schritte, Knopf direkt zur Funktion); sie erscheint im Update-Popup und bleibt unter „Was ist neu“.
- Noch offen: Installation und Menünamen auf einem echten iPhone prüfen (siehe oben).

## Neue Version ausliefern

1. Version in `package.json` erhöhen (`npm version 0.4.0 --no-git-tag-version`) **und im selben Schritt** einen Eintrag oben in `src/changelog.ts` ergänzen (3 bis 5 kurze Sätze, Du-Form). Ein Unit-Test schlägt sonst fehl, und ohne Eintrag erscheint kein Update-Popup.
2. `npm run typecheck && npm run lint && npm test && npm run test:e2e`
3. `npm audit --omit=dev` – hohe oder kritische Funde beheben oder in `DECISIONS.md` begründen.
4. `npm run build && npm run check:external`, danach `npm run snapshot`.
5. Inhalt von `dist/` hochladen (siehe unten).

## Deployment (Cloudflare, von Hand)

Anders als in den anderen PWA-Projekten wird hier **`dist/`** ausgeliefert, nicht `public/`. `public/` enthält nur die Rohdateien (Icons, `_headers`), die beim Build nach `dist/` kopiert werden.

Den **Inhalt** von `dist/` hochladen (nicht den Ordner selbst; `index.html` liegt oben). Dazu gehören auch `_headers`, `sw.js`, `registerSW.js`, `workbox-….js`, `manifest.webmanifest`, die Icons und `assets/`.

Nach dem Hochladen prüfen:

- Entwicklertools → Netzwerk → Antwort von `index.html` hat den Header `Content-Security-Policy`.
- App einmal laden, offline schalten, neu laden: Die App startet weiter.

Alternativ geht es per Kommandozeile: einmalig `npx wrangler login`, danach `npm run deploy` (nutzt `wrangler.jsonc`, kein Worker-Code, kein API-Token).

Weitere Hinweise:

- Zugang ist eine nicht verlinkte `*.workers.dev`-Adresse; ein Zugangsschutz ist nicht Teil dieses Auftrags.
- Cloudflare Web Analytics bleibt **aus**.
- Rollback: Im Dashboard (Workers & Pages → Worker → Deployments) bzw. per `wrangler rollback`. Ob das für statische Dateien uneingeschränkt gilt, ist **zu prüfen**. Verlässlich ist: Sicherung aus `../babytime-snapshots/` zurückkopieren, bauen, erneut hochladen.
- **Notfall** (fehlerhafte Version ausgeliefert): sofort eine korrigierte Version hochladen; der Service Worker holt sie beim nächsten Start. Hilft das nicht, einen Build ausliefern, dessen `sw.js` sich selbst abmeldet (`self.registration.unregister()`) und die Caches leert.

## Projekt

- `spec.md` – Auftrag; `DECISIONS.md` – Entscheidungen und Abweichungen
- `Baby Time – Mockups-png/` – Gestaltungsvorlage
- `src/data/` – einziger Zugriff auf die Datenbank (Dexie/IndexedDB), inkl. Sicherung (`backup.ts`)
- `src/logic/` – Zeit, Tageszähler, nächste Seite, Eingabeprüfung (ohne UI, mit Unit-Tests)
- `src/version.ts`, `src/changelog.ts` – Versionsvergleich und Neuerungen
- `src/views/`, `src/ui/` – Screens und Bausteine; alle Texte in `src/strings.de.ts` und `src/strings.en.ts`, Auswahl in `src/strings.ts`
