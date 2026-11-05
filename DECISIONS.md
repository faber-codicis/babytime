# Entscheidungen und Abweichungen

Kurz begründet, neueste unten. Paketänderungen stehen im Abschnitt „Abhängigkeiten“.

## Allgemein

- **Mockups sind die Gestaltungsvorlage** (`Baby Time – Mockups-png/`). Bei Widerspruch gilt der Umfang der Spec (z. B. keine Meilensteine-/Einstellungen-Tabs), das Aussehen folgt den Mockups.
- **Deployment-Ordner ist `dist/`, nicht `public/`** (anders als in den anderen PWA-Projekten): `public/` ist Vites Quellordner für statische Dateien, der Build leert den Ausgabeordner, `dist/` wird nicht gesichert. Mit der Besitzerin so abgestimmt (Variante A).
- **Deployment von Hand:** Die Besitzerin lädt nach `npm run build` den Inhalt von `dist/` selbst im Cloudflare-Dashboard hoch. `wrangler.jsonc` und das Skript `deploy` bleiben wie in §13.1 gefordert als Alternative bestehen.
- **Nachtmodus-Mockup** zeigt einen eigenen Ring-Aufbau; laut Spec §15 („Nachtmodus-Ring“) später. Dunkel wird in Stufe B nur über die Farb-Tokens umgesetzt.

## Stufe A

- **Splash:** Strahlen-Ring (12 Striche, 4 längere), Deko-Kreise und Punkte nach Mockup als statisches SVG/HTML in `index.html`; Gesicht = Logo-Motiv ohne Rechteck. Der Splash endet, sobald die Datenbank offen ist, spätestens nach 1,2 s.
- **Tab-Leiste in Stufe A nicht gebaut:** Ohne Verlauf gäbe es nur einen Tab; laut §2a darf sie bis Stufe B fehlen.
- **Dunkle Tokens** lagen in Stufe A unter `:root[data-theme='dark']` bereit (§2a: Stufe A nur hell); seit 0.3.1 schaltet genau dieser Selektor das dunkle Design.
- **Schrift nur im Subset `latin`** (deckt ä ö ü ß und „ “ – ab); kleinerer Precache. Nur `woff2` wird vorgeladen, die `woff`-Fallbacks liegen ungecacht in `dist/` und werden von aktuellen Browsern nicht geladen.
- **Service-Worker-Registrierung über `registerSW.js`** (`injectRegister: 'script'`) statt Inline-Skript, damit die CSP bei `script-src 'self'` bleibt. `registerSW.js` bekommt in `_headers` ebenfalls `no-cache`.
- **`check:external` erlaubt genau drei Kurz-Links aus Fehlermeldungen:** `https://bit.ly/wb-precache` (Workbox), `https://tinyurl.com/y2uuvskb` und `http://bit.ly/2kdckMn` (Dexie). Sie stehen nur im Text von Fehlermeldungen und werden nie angefragt; der E2E-Test prüft zusätzlich, dass keine externen Requests stattfinden.
- **`vite preview` liefert die Header aus `public/_headers`** (Block `/*`), damit E2E-Tests lokal mit derselben CSP laufen wie bei Cloudflare.
- **Offline-Smoke-Test schon in Stufe A** (`tests/e2e/offline.spec.ts`), weil er ohne großen Aufwand ging; er prüft auch CSP-Header, Konsolenfehler und externe Requests.
- **`apple-touch-icon` und maskable-Icon randlos** (Rosé vollflächig), weil iOS und Android die Ecken selbst abrunden; die `any`-Icons behalten die runden Ecken des Logos.
- **UI-Zugriff auf Dexie per Lint verboten** (`no-restricted-imports` für `dexie` und `data/db` außerhalb von `src/data/`), damit §5 nicht versehentlich gebrochen wird.
- **Doppeltipp auf Stillen/Schlaf** legt kein zweites laufendes Event an: `startFeed` gibt ein laufendes Stillen unverändert zurück.
- **Abbrechen beim Stillen** verwirft nur die gerade laufende Seite; vorher per Seitenwechsel abgeschlossene Seiten bleiben gespeichert (sie sind eigene Events).
- **Ende nie vor Start:** Springt die Geräteuhr zurück, wird `end` auf `start` gesetzt.
- **Stillen zählt als Sitzung:** Ein Seitenwechsel erzeugt laut §5 zwei Events, im Chip „6× gestillt“ zählt das als ein Stillen (Events, die höchstens 1 Minute auseinanderliegen, bilden eine Sitzung).
- **Schlafsumme in Stunden und Minuten** („9 Std 25 Min Schlaf“, „40 Min Schlaf“) statt ganzer Stunden (Wunsch der Besitzerin, 2026-10-21, in `spec.md` §6.2 übernommen): Neugeborene schlafen in vielen kurzen Etappen, abgerundete Stunden zeigten vormittags oft „0 Std“. Schlaf über Mitternacht zählt nur ab 00:00.
- **Alter:** „x Tage alt“ zählt Kalendertage; am Geburtstag selbst „heute geboren“. Relative Zeit ab 24 Std: „vor 1 Tag“ / „vor 2 Tagen“.
- **Avatar:** Mit Babyname zeigt er wie im Mockup den Anfangsbuchstaben auf `#F3C7B8`, ohne Namen (Stufe A immer) das Logo-Gesicht laut §6.2.
- **Hero bei laufendem Stillen:** Kopf „Stillt gerade“, große Zahl ist der laufende Timer (mm:ss, sekündlich aktualisiert), Zeile „links · seit 14:12“; die ganze Karte führt zurück zum Stillen-Screen. „Nächste Seite“ bleibt die Gegenseite des letzten *abgeschlossenen* Stillens.
- **„Zuletzt gestillt“** misst ab dem Ende der letzten Stillsitzung; die Zeile zeigt die zuletzt gestillte Seite, die Dauer der ganzen Sitzung (beide Seiten) und die Uhrzeit des Endes (Mockup: 14:20 − 1 Std 40 Min = 12:40).
- **Schlaf-Karte** nach Mockup zweizeilig: groß „seit 25 Min“, darunter „schläft gerade“ bzw. „wach“ (statt „schläft seit …“ in einer Zeile).
- **Aktions-Dock** klebt unten (`position: sticky`), solange es keine Tab-Leiste gibt; in Stufe B sitzt es über der Tab-Leiste.
- **Stillen-Screen: „Abbrechen“ statt „Pause“** (Mockup zeigt Pause, §6.3 schließt Pause aus und verlangt Abbrechen). Rückfrage als Bottom-Sheet; Standardfokus auf „Weiter stillen“.
- **Seitenwechsel per Ziel-Seite** (`switchFeedSide('right')`): Ein Doppeltipp auf dieselbe Seite wechselt nicht zurück. Schreibaktionen in der UI laufen zusätzlich nacheinander (kein Doppel-Start bei Schlaf).
- **„Letztes Mal …“** auf dem Stillen-Screen zeigt das Stillen *vor* der laufenden Sitzung, nicht die gerade weggeschaltete Seite.
- **Sheets über natives `<dialog>`** mit `showModal()`: Fokusfalle, Escape und inerter Hintergrund kommen vom Browser. Weil Touch-Browser (auch iOS Safari) angetippte Buttons nicht fokussieren, merkt sich das Sheet den zuletzt angetippten Button, um den Fokus beim Schließen dorthin zurückzugeben.
- **Snackbar** liegt direkt über dem Dock (Daumenreichweite), `role="status"`, 6 Sekunden; eine neue Meldung ersetzt die alte. Texte: „Windel gespeichert“, „Schlaf gestartet“, „Schlaf beendet“.
- **„gerade eben“ statt „0 Min“** in der Hero-Karte und der Schlaf-Karte während der ersten Minute.
- **Wake Lock** wird auf dem Stillen-Screen angefordert und nach dem Zurückkehren in die App erneut geholt; ohne API oder bei Ablehnung läuft der Timer normal weiter.
- **Installationshinweis vorgezogen** (Wunsch der Besitzerin, 2026-10-21): Karte oben auf Heute, nur im iOS-Safari-Tab (`navigator.standalone === false`, kein `display-mode: standalone`). Text für iOS 26 angepasst („•••“ → Teilen → „Zum Home-Bildschirm“, „Als Web-App öffnen“ an lassen), in `spec.md` §6.7 übernommen. Geschlossen-Zustand in `kv` (`installHintDismissed`). Die Menünamen sind nicht auf einem echten iPhone geprüft.
- **Install-Button für Android** (Wunsch der Besitzerin, 2026-10-21): Karte „Als App installieren“ mit Button, sobald Chrome `beforeinstallprompt` meldet. Das Ereignis wird gleich beim Start abgefangen (`src/ui/installPrompt.ts`), weil Chrome es vor dem ersten Rendern senden kann. Chromes eigene Mini-Leiste wird dafür unterdrückt; über das Menü ⋮ bleibt die Installation immer möglich.
- **Versionsanzeige auf Heute mit Build-Zeitpunkt** (Wunsch der Besitzerin): Die Version bleibt bis zum nächsten Release gleich, der Build-Zeitpunkt zeigt, ob ein neuer Upload angekommen ist (Service-Worker-Update erst beim zweiten Laden). Seit 0.3.1 oben rechts in der Kopfzeile; unter den Chips wurde sie vom Aktions-Dock verdeckt.
- **Fester Test auf Installierbarkeit:** `tests/e2e/installable.spec.ts` fragt Chrome über das DevTools-Protokoll nach Installationsfehlern (Manifest, Icons, Service Worker).
- **Unit-Tests laufen in `Europe/Vienna`**, damit Tagesgrenzen und die Zeitumstellung reproduzierbar geprüft werden.

## Stufe B

- **E2E-Tests in zwei Engines:** Projekt `chromium` (Pixel 7, Ersatz für Android) und `webkit` (iPhone 13, Safari-Engine; kein echtes iPhone). Der Installierbarkeits-Check läuft nur in Chromium.
- **Tabs als Links** (`<a href="#/verlauf">` mit `aria-current="page"`) statt `<button>` wie in §6.1: Es sind Navigationsziele, Links sind dafür die passende Semantik; Aussehen und Mindestgröße wie spezifiziert.
- **Verlauf zeigt zunächst 14 Tage**, „Ältere Einträge anzeigen“ lädt jeweils 14 weitere – die Liste bleibt auch nach Monaten schnell.
- **Löschen im Bearbeiten-Sheet** fragt direkt im Sheet nach („Diesen Eintrag wirklich löschen?“, Standardfokus „Behalten“) statt in einem zweiten Dialog; danach Snackbar mit „Rückgängig“. Speichern zeigt ebenfalls „Eintrag gespeichert · Rückgängig“.
- **Nachtragen:** Ende leer = läuft noch, nur wenn nicht schon ein Stillen bzw. Schlaf läuft (sonst Fehlermeldung am Feld). Zeiten bis 1 Minute in der Zukunft sind erlaubt (Minutengenauigkeit des Eingabefelds). Beim Bearbeiten ist die Art des Eintrags fest; beim Speichern werden fremde Felder (z. B. Seite bei einer Windel) verworfen.
- **Datumsfelder hören auf `input` und `change`**, weil Safari/iOS-Picker teils nur `change` auslösen; das Formular wird im selben Frame befüllt, in dem das Sheet öffnet.
- **Erststart als ein Screen** (§6.7) im Look der Mockups „Willkommen“ (Herz, Deko-Kreise, Titel) und „Einrichtung“ (Felder, „Ohne Namen fortfahren“). Weggelassen: Name der Mutter, Avatar-Schritt (beides „Nicht im Umfang“), Schrittanzeige und die drei Tipp-Karten (Screen bleibt kurz). Der Datenschutz-Satz (§13.7) steht im Einleitungstext.
- **„Los geht’s“ ohne Eingaben** schließt ebenfalls ab (alles freiwillig). „Ohne Namen fortfahren“ verwirft bereits eingetippte Werte. Ein Geburtsdatum in der Zukunft wird am Feld abgelehnt.
- **Bestehende Testgeräte** (Stufe A ohne Profil) sehen den Erststart einmal nach dem Update; ihre Einträge bleiben erhalten.
- **„Profil bearbeiten“** nutzt dieselben Felder in einem Sheet; Name und Datum lassen sich dort auch wieder leeren.
- **Dunkles Design zum Einschalten statt automatisch** (Wunsch der Besitzerin, 0.3.1, in `spec.md` §4 und §14 übernommen): Die erste Fassung nach `prefers-color-scheme` mit den Spec-Tokens war schlecht lesbar. Jetzt Standard hell, Schalter „Dunkles Design“ in „Daten und Info“; überarbeitete Tokens mit hellerer Schrift und farbig getönten Karten (Text ≥ 6,1:1 auf jeder Fläche, Karten mit feiner Kontur). Ein E2E-Test prüft: hell trotz dunkler Systemeinstellung, Schalter wirkt sofort und nach Neustart, kein reines Weiß, „Alle Daten löschen“ setzt auf hell zurück.
- **Gespeichert in `localStorage`** (`babytime-theme`), nicht in IndexedDB: `public/theme-init.js` muss die Wahl vor dem ersten Bild synchron lesen, sonst blitzt der Splash hell auf. Das Skript ist eine eigene Datei, weil die CSP keine Inline-Skripte erlaubt. Ohne Speicherzugriff bleibt die App hell.
- **Splash im dunklen Design dunkel** (`#150D10`) statt Vollbild in `--rose`, sonst ein greller Blitz um 3 Uhr. `theme-color` wird passend umgestellt. Avatar-Gesicht im Dunkeln gedimmt wie das Nacht-Logo im Mockup.
- **Nachtmodus-Ring** aus dem Mockup „Übersicht (Nachtmodus)“ bleibt laut §15 für später; Dunkel ist nur das Farbschema.
- **Export:** Auf iOS über das Teilen-Menü (→ „In Dateien sichern“), sonst als Download (§6.8). Die Datei wird schon beim Öffnen des Sheets vorbereitet, weil Safari das Teilen nur direkt im Tipp erlaubt; nach dem Tippen schließt das Sheet und die Snackbar bestätigt „Sicherung erstellt“. Hinweis auf die unverschlüsselte Datei steht direkt am Eintrag.
- **Import:** Größe wird vor dem Lesen geprüft (≤ 10 MB), danach jeder Eintrag einzeln (UUID, Typ, Zeiten als endliche ms-Werte zwischen 2000 und 2200 – fängt Sekunden statt Millisekunden –, `end ≥ start`, Seite nur bei Stillen, Art nur bei Windel, Notiz ≤ 500 Zeichen, keine doppelten IDs, höchstens ein laufendes Stillen/Schlaf). Objekte werden nur aus geprüften Feldern neu gebaut (`hasOwnProperty`, kein Spread). Ein Fehler → nichts geändert, Meldung nennt die Eintragsnummer. Sicherungen aus einer neueren Schema-Version werden mit eigener Meldung abgelehnt.
- **Ersetzen** tauscht Einträge (und Profil, falls in der Datei) aus; **Zusammenführen** ergänzt nach `id`, bei gleicher `id` gewinnt die zuletzt bearbeitete Fassung, das Profil auf dem Handy bleibt. Läuft in Datei und auf dem Handy gleichzeitig etwas, wird das Zusammenführen abgelehnt. Beides in einer Transaktion (alles oder nichts).
- **„Alle Daten löschen“** in eigener Gruppe mit Warnfarbe, eigenem Icon und erklärendem Text; Rückfrage mit Standardfokus „Abbrechen“. Löscht `events` und alle `kv`-Werte, danach Erststart; Service Worker und Caches bleiben.
- **Update-Popup** (§6.9): Logik in `src/version.ts` (`decideUpdate`), Anzeige über `useUpdatePopup`. Es öffnet nur auf Heute, höchstens einmal pro Start; jeder Weg zu schließen setzt `lastSeenVersion` sofort. Standardfokus „Alles klar“. Zeigt höchstens 5 Punkte; bei mehreren übersprungenen Versionen mit Versionsüberschriften. Eine gespeicherte *höhere* Version (Rückkehr zu einem älteren Build) zeigt nichts.
- **Kein Changelog-Eintrag für 0.1.0** (Mockup „Was ist neu“ zeigt ihn): Diese Version wurde nie ausgeliefert. Erster Eintrag ist 0.2.0 (Stufe A).
- **„Was ist neu“** (`#/neu`) ohne Tab-Leiste; Zurück geht in der Browser-Historie zurück (vom Popup nach Heute, aus „Daten und Info“ in den Verlauf).
- **`logic/` importiert Typen nur aus `data/events`**, nicht aus `data/db` (Lint-Regel gilt für alles außerhalb von `src/data/`).

## 0.4.0

- **Tab „Einstellungen“ vorgezogen** (Wunsch der Besitzerin; spec §6.1, neuer §6.10): Der ⓘ-Knopf „Daten und Info“ im Verlauf entfällt, sein Inhalt plus Profil-Karte, letzte Sicherung, Update-Prüfung und Installationshinweis stehen im Tab. Drei Tabs wie im Mockup „Navigation“ (Variante ohne Meilensteine).
- **Datenaktionen als Hooks** (`ui/useDataActions.tsx`, `useExport`): Export, Wiederherstellen, Profil, Löschen werden von Einstellungen und Sicherungs-Karte geteilt. Die Exportdatei wird per Live-Abfrage vorab gebaut und bei Datenänderungen erneuert (iOS erlaubt Teilen nur direkt im Tipp).
- **Letzte Sicherung** = Zeitpunkt, an dem die Datei übergeben wurde (Teilen-Menü bestätigt oder Download gestartet), in `kv` `lastExportAt`. Ob die Datei danach wirklich gespeichert wurde, kann die App nicht wissen. „Alle Daten löschen“ entfernt den Wert mit.
- **Sicherungs-Erinnerung:** Bezug ist die letzte Sicherung, ohne Sicherung der älteste Eintrag (sonst würde die Karte schon am ersten Tag erscheinen). Nach dem Schließen 14 Tage Ruhe (`kv` `backupReminderDismissedAt`), mit der Besitzerin abgestimmt. Die Exportdatei wird nur vorbereitet, solange die Karte sichtbar ist.
- **Update-Erkennung ohne zusätzliche Requests:** `skipWaiting` und `clientsClaim` sind gesetzt, eine neue Version übernimmt nach dem Download sofort. Ein `controllerchange` bei einer Seite, die schon vom Service Worker gesteuert war, heißt „neue Version aktiv“ → Pille „Update bereit“. „Nach Update suchen“ ruft `registration.update()` (nur eigener `sw.js`); keine `version.json`, deshalb ohne neue Versionsnummer im Hinweis. Neustart nur auf Tippen, nie automatisch.
- **Versions-Pille A+C** (Mockup-Artifact „Baby Time – Versionsanzeige“) ersetzt das zweizeilige Kästchen. Das Infofenster ist ein schlichtes `role="dialog"`-Element (kein modales `<dialog>`), schließt mit Escape und Tippen außerhalb; Listener werden im selben Frame angemeldet (`useLayoutEffect`).
- **Vollbild auf Android** (Wunsch der Besitzerin): Manifest `display: fullscreen` mit `display_override: [fullscreen, standalone]`. Die helle Android-Navigationsleiste ließ sich im dunklen Design nicht einfärben (feste Manifest-Farben). Die Installationserkennung prüft deshalb auch `display-mode: fullscreen`. Bestehende Installationen müssen einmal neu installiert werden, damit die Änderung greift.
- **Android-Startbild dunkel:** `background_color` im Manifest ist `#3D2129` statt hell. Das System-Startbild (Icon auf dieser Farbe, ohne Text) kann dem Theme-Schalter nicht folgen und war nachts hell. Unser eigener Splash mit Tagline erscheint danach nur so lange, bis die Datenbank bereit ist (Spec §6.0: nie künstlich verlängern).
- **Geburtsdatum höchstens 24 Monate zurück** (0.4.2, Wunsch der Besitzerin; erst 12 Monate erwogen, aber großzügiger gewählt, falls Bekannte die App für ältere Kleinkinder nutzen). Geprüft nur bei der Eingabe (Erststart, Profil bearbeiten), nicht beim Laden: Ein älteres, schon gespeichertes Datum bleibt erhalten und wird nicht stillschweigend gelöscht; beim Bearbeiten des Profils muss es dann geändert oder geleert werden.
- **Altersanzeige:** Tage bis 14 Tage, dann Wochen bis 3 volle Monate, dann Monate, ab 24 Monaten Jahre (`formatAge`). Reine Tageszahlen wie „150 Tage alt“ waren nicht lesbar.
- **Mehr Wege zur Version:** Splash, Pille auf Heute, Einstellungen. Die frühere Versionskarte im Sheet entfällt mit dem Sheet.

## 0.4.3 (Security-Audit)

- **Export mit Passwort** zusätzlich zum normalen Export, nicht statt dessen: Ein vergessenes Passwort heißt Datenverlust, deshalb bleibt die einfache Sicherung der Standard. Krypto nur über WebCrypto (keine neue Abhängigkeit): PBKDF2-SHA256 mit 600 000 Runden (OWASP), AES-GCM 256, zufälliges Salt (16 Byte) und IV (12 Byte) pro Datei. Beim Import werden nur 100 000 bis 2 000 000 Runden akzeptiert, damit eine präparierte Datei das Handy nicht minutenlang rechnen lässt. Die Datei bleibt JSON, damit die Dateiauswahl sie annimmt; nach dem Entschlüsseln läuft dieselbe Prüfung wie beim normalen Import.
- **Zwei Tipps beim Export mit Passwort:** Verschlüsseln dauert einen Moment, iOS erlaubt das Teilen aber nur direkt im Tipp. Deshalb erst „Datei erstellen“, dann „Datei sichern“.
- **HSTS** in `public/_headers` (1 Jahr, mit Subdomains; ohne `preload`, weil das schwer rückgängig zu machen ist).
- **Abhängigkeiten:** `wrangler` aktualisiert, damit die hohe Lücke in `undici` weg ist. Die übrigen mittleren/niedrigen Meldungen (`minimatch`, `glob`, `deepmerge` unter eslint und vite-plugin-pwa) betreffen nur Build-Werkzeuge, nicht die ausgelieferte App. Ein `overrides` auf `minimatch@11` wurde getestet und verworfen: Danach fand Workbox nur noch 6 statt 22 Dateien für den Offline-Cache.

## 0.5.0 (Designüberarbeitung)

Vorschläge A1–A4 und B1–B3 aus der Designdurchsicht vom 2026-11-05, auf Wunsch des Besitzers umgesetzt. Nicht umgesetzt (ändern die Spec stärker, eher später): „Nachts automatisch dunkel“, Tages-Zeitleiste auf Heute, Nachtmodus-Layout.

- **Laufendes Stillen auf Heute:** Die Hero-Zeile heißt dann „Seite“ und markiert die gerade gestillte Seite. Der Dock-Button wird zweizeilig „Stillen läuft“ + Timer; sein zugänglicher Name ist „Stillen läuft, mm:ss, zum Timer“. Er ruft weiter `startFeed`, das ein laufendes Stillen unverändert zurückgibt – also nur Navigation.
- **Tageszähler als Leiste:** Drei gleich breite Felder, Schlaf als „9:25 Std“. Der Text jedes Felds bleibt als ganzer Satz lesbar („6× gestillt“, „9:25 Std Schlaf“), weil Wert und Label durch ein Leerzeichen getrennt sind.
- **Versions-Pille nur bei Update:** Die Pille war für die Testphase gewünscht (Upload prüfen). Der Build-Zeitpunkt steht weiter in Einstellungen → Über die App und auf dem Splash; auf Heute erscheint nur noch „Update bereit“. Das Popover entfällt.
- **Dunkles `--rose` #D9827A** statt #F09A8F: Der Stillen-Button war nachts die hellste Fläche. Dunkler Text darauf 6,7:1, gegen den Hintergrund 6,8:1 – die ≥ 6:1-Regel aus 0.3.1 hält.
- **Windel „vor x Min“:** Zeit wird ab `Date.now()` beim Tippen gerechnet. Die Windel-Karte aktualisiert sich nur alle 30 Sekunden, kann also kurz „vor 14 Min“ zeigen.
- **Abstand im Verlauf:** Beginn zu Beginn (so fragen Hebamme und Kinderärztin), pro Stillsitzung (Seitenwechsel zählt als eine), nur unter 12 Stunden.

## Abhängigkeiten

| Paket | Art | Grund |
| --- | --- | --- |
| `preact`, `dexie`, `@fontsource/plus-jakarta-sans` | Laufzeit | laut Spec §3 |
| `vite`, `typescript`, `vite-plugin-pwa`, `vitest`, `@playwright/test` | Entwicklung | laut Spec §3 |
| `@preact/preset-vite` | Entwicklung | JSX-Umwandlung und Dev-Tools für Preact in Vite |
| `eslint`, `@eslint/js`, `typescript-eslint`, `globals` | Entwicklung | Lint-Lauf mit den Verboten aus §13.3 |
| `fake-indexeddb` | Entwicklung | Dexie-Tests in Node ohne Browser |
| `@types/node` | Entwicklung | Typen für `vite.config.ts` (liest `_headers` für `vite preview`) und Node-Skripte |
| `sharp` | Entwicklung | Icons aus dem Logo erzeugen (§7) |
| `wrangler` | Entwicklung | Skript `deploy` (§13.1), wird von Claude nie ausgeführt |

npm 11 blockiert die Install-Skripte von `esbuild` und `workerd` (nicht freigegeben). `esbuild` bezieht sein Binary über optionale Abhängigkeiten, `workerd` wird nur für `wrangler dev` gebraucht; Build und Deploy laufen ohne.
