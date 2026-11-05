# Baby Time

PWA zum Mitschreiben von Stillen, Windeln und Schlaf – einhändig, offline, ohne Konto. Testversion 0.6.0.

**Datenschutz:** Alle Einträge bleiben auf dem Gerät. Es gibt keinen Upload, keine Weitergabe, keine Analyse.

## Was die App kann

- **Heute:** zuletzt gestillt, nächste Seite, letzte Windel, Schlaf, Tageszähler. Stillen mit Timer und Seitenwechsel, Windel in 2 Taps, Schlaf in 1 Tap, Flasche und Abpumpen mit Menge, jeweils mit „Rückgängig“.
- **Verlauf:** Liste nach Tagen, Einträge ändern, löschen und nachtragen.
- **Erststart** mit Babyname und Geburtsdatum (beides freiwillig).
- **Einstellungen** (eigener Tab): Profil, **Dunkles Design** ein/aus (Standard: hell), Sicherung exportieren (mit „Letzte Sicherung: vor x Tagen“) und wiederherstellen, alle Daten löschen, Version mit **Nach Update suchen**, „Was ist neu“, Installationshinweis.
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
| Test durch die Freundin | Cloudflare (siehe unten), URL nicht öffentlich verbreiten. |

**iPhone (iOS 26):** Link in Safari öffnen – oben erscheint die Karte „Als App installieren“ mit denselben Schritten:

1. Auf **•••** tippen.
2. **Teilen** → **„Zum Home-Bildschirm“**.
3. **„Als Web-App öffnen“** eingeschaltet lassen → **„Hinzufügen“**.

Danach die App vom Home-Bildschirm starten, Flugmodus an, App ganz schließen und neu starten: Sie muss mit allen Funktionen laufen. Bitte immer die installierte App verwenden, nicht den Safari-Tab – Safari kann Daten von nicht installierten Seiten nach längerer Nichtnutzung löschen. Die Menünamen sind ohne echtes iPhone formuliert; weichen sie ab, Text in `src/strings.de.ts` (`installHint`) und `spec.md` §6.7 anpassen.

**Android (Chrome):** Link öffnen → oben erscheint „Als App installieren“ mit Button **Installieren** (sobald Chrome die Installation anbietet), sonst Menü **⋮** → **„App installieren“**. Danach wie oben offline testen.

Oben rechts auf **Heute** steht die Versions-Pille „vx.y.z“; antippen zeigt Datum und Uhrzeit des Builds. Nach einem Upload: Pille antippen → **Nach Update suchen**. Sobald die neue Version geladen ist, wird die Pille zu **Update bereit** – antippen startet sie. Ohne Antippen übernimmt die App sie beim nächsten Start.

## Erster Start bei der Freundin (Checkliste)

1. Link in **Safari** öffnen, App wie oben installieren, dann **nur noch vom Home-Bildschirm** starten.
2. Erststart: Name und Geburtsdatum eintragen oder „Ohne Namen fortfahren“.
3. Einmal Flugmodus an, App neu starten – alles muss gehen.
4. Testeinträge vom Ausprobieren entfernen: **Einstellungen** → **Alle Daten löschen**.
5. Ab und zu sichern: **Einstellungen** → **Daten exportieren** → „In Dateien sichern“ (oder „Jetzt sichern“ auf der Erinnerungskarte). Die Datei ist unverschlüsselt; nach einem Wiederherstellen löschen.

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
- `src/views/`, `src/ui/` – Screens und Bausteine; alle Texte in `src/strings.de.ts`
