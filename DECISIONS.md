# Entscheidungen und Abweichungen

Kurz begründet, neueste unten. Paketänderungen stehen im Abschnitt „Abhängigkeiten“.

## Allgemein

- **Mockups sind die Gestaltungsvorlage** (`docs/design/mockups/`). Bei Widerspruch gilt der Umfang der Spec (z. B. keine Meilensteine-/Einstellungen-Tabs), das Aussehen folgt den Mockups.
- **Deployment-Ordner ist `dist/`, nicht `public/`** (anders als in den anderen PWA-Projekten): `public/` ist Vites Quellordner für statische Dateien, der Build leert den Ausgabeordner, `dist/` wird nicht gesichert. Mit der Besitzerin so abgestimmt (Variante A).
- **Deployment von Hand:** Die Besitzerin lädt nach `npm run build` den Inhalt von `dist/` selbst im Cloudflare-Dashboard hoch. `wrangler.jsonc` und das Skript `deploy` bleiben wie in §13.1 gefordert als Alternative bestehen. **Abgelöst seit 0.15.1:** siehe „Deployment über GitHub Actions“.
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
- **Abhängigkeiten:** `wrangler` aktualisiert, damit die hohe Lücke in `undici` weg ist. Die übrigen mittleren/niedrigen Meldungen (`minimatch`, `glob`, `deepmerge` unter eslint und vite-plugin-pwa) betreffen nur Build-Werkzeuge, nicht die ausgelieferte App. Ein `overrides` auf `minimatch@11` wurde getestet und verworfen: Danach fand Workbox nur noch 6 statt 22 Dateien für den Offline-Cache. `glob` unter `workbox-build` ist dagegen per `overrides` auf 14.x gehoben (beseitigt die Deprecation-Warnung von `glob@11` bei `npm ci` und die glob-Meldung im Audit); der Offline-Cache enthält danach dieselben 22 Dateien.

## 0.5.0 (Designüberarbeitung)

Vorschläge A1–A4 und B1–B3 aus der Designdurchsicht vom 2026-11-05, auf Wunsch des Besitzers umgesetzt. Nicht umgesetzt (ändern die Spec stärker, eher später): „Nachts automatisch dunkel“, Tages-Zeitleiste auf Heute, Nachtmodus-Layout.

- **Laufendes Stillen auf Heute:** Die Hero-Zeile heißt dann „Seite“ und markiert die gerade gestillte Seite. Der Dock-Button wird zweizeilig „Stillen läuft“ + Timer; sein zugänglicher Name ist „Stillen läuft, mm:ss, zum Timer“. Er ruft weiter `startFeed`, das ein laufendes Stillen unverändert zurückgibt – also nur Navigation.
- **Tageszähler als Leiste:** Drei gleich breite Felder, Schlaf als „9:25 Std“. Der Text jedes Felds bleibt als ganzer Satz lesbar („6× gestillt“, „9:25 Std Schlaf“), weil Wert und Label durch ein Leerzeichen getrennt sind.
- **Versions-Pille nur bei Update:** Die Pille war für die Testphase gewünscht (Upload prüfen). Der Build-Zeitpunkt steht weiter in Einstellungen → Über die App und auf dem Splash; auf Heute erscheint nur noch „Update bereit“. Das Popover entfällt.
- **Dunkles `--rose` #D9827A** statt #F09A8F: Der Stillen-Button war nachts die hellste Fläche. Dunkler Text darauf 6,7:1, gegen den Hintergrund 6,8:1 – die ≥ 6:1-Regel aus 0.3.1 hält.
- **Windel „vor x Min“:** Zeit wird ab `Date.now()` beim Tippen gerechnet. Die Windel-Karte aktualisiert sich nur alle 30 Sekunden, kann also kurz „vor 14 Min“ zeigen.
- **Abstand im Verlauf:** Beginn zu Beginn (so fragen Hebamme und Kinderärztin), pro Stillsitzung (Seitenwechsel zählt als eine), nur unter 12 Stunden.

- **Lachendes Baby bei Neuerungen** (Wunsch des Besitzers: „Splashscreen bei Changelog mit einem lachenden Baby“): umgesetzt als Banner im Splash-Look oben im Update-Popup und auf „Was ist neu“, nicht als eigener Vollbild-Screen, der den Start verzögern würde. Das Gesicht ist eine Variante des Logos (`LaughingBaby` in `ui/icons.tsx`), gleiche Farben. Keine eigene Versionsnummer: Der Banner kommt mit der nächsten Version.

## 0.6.0 (Flasche und Abpumpen)

- **Eigene Eintragsarten `bottle` und `pump`** statt Erweiterung von `feed`: Stillen hat Timer, Seite und Sitzungen; Flasche und Abpumpen sind Zeitpunkte mit Menge. Sie zählen nicht als „gestillt“ und ändern die nächste Stillseite nicht.
- **Kein Timer fürs Abpumpen:** Hebamme und Kinderärztin fragen nach Menge, nicht nach Dauer; ein zweiter laufender Timer neben Stillen und Schlaf wäre nachts verwirrend. Bei Bedarf später.
- **`pumpSide` als eigenes Feld** (mit „beide“), damit `side` beim Stillen nur links/rechts kennt.
- **„Pulvermilch“** als Gegenstück zu Muttermilch: deckt Pre- und 1er-Nahrung ab, ohne eine Marke oder Stufe zu nennen.
- **Ein Dock-Button für beides** (Flasche, darin Umschalter Abpumpen) statt fünf Buttons. Das Sheet öffnet in der Art des letzten Eintrags, so braucht eine Mutter, die nur abpumpt, ebenfalls 2 Taps.
- **Menge per − / + in 10-ml-Schritten** statt Zahlentastatur: einhändig und nachts ohne Tippen; „+“ springt auf die nächste 10er-Marke. Beim Bearbeiten im Verlauf gibt es ein Zahlenfeld für genaue Werte.
- **Grenzen 1 bis 1000 ml, nur ganze ml**, bei Eingabe, beim Speichern und beim Import geprüft.
- **Sicherungsformat Version 2:** Ältere Apps lehnen Dateien mit Flaschen sonst mit „Eintrag n ist fehlerhaft“ ab; so sagen sie „aus einer neueren Version“. Version-1-Dateien werden weiter gelesen. Dexie bleibt bei Version 1, weil keine Indizes dazukommen.
- **Neue Farbe `--sky`** (hell #DCEBF2 / Schrift #1D4A5E, 7,8:1; dunkel #1C2A31 / #B4D8E8, 9,8:1), damit Flasche sich von Stillen (Rosé) abhebt.
- **Ml-Felder nur an Tagen mit Einträgen:** Ein voll gestilltes Baby sieht Heute wie bisher.

## 0.7.0 (Paket C: Nacht und Zeitleiste)

Auf Wunsch des Besitzers (2026-11-05) umgesetzt: C1 „Nachts automatisch“, C2 Tages-Zeitleiste, C3 Nachtansicht.

- **Nachts nach der Uhr, nicht nach dem System:** Die erste Fassung (System-Einstellung) war schlecht lesbar, deshalb feste Zeiten 20–7 Uhr. Die Stunden stehen zweimal (`data/theme.ts` und `public/theme-init.js`), weil das Init-Skript vor dem App-Code laufen muss.
- **Zwei Schalter statt Auswahlliste:** Der bestehende Schalter „Dunkles Design“ bleibt, wie er war (E2E-Tests und Gewohnheit); „Nachts automatisch“ steht darunter. Beide speichern in denselben Schlüssel, höchstens einer ist an.
- **Nachtansicht nur mit „Nachts automatisch“:** Wer „Dunkles Design“ dauerhaft an hat, behält die gewohnte Ansicht auch nachts. Die Nachtansicht ist an die Nacht-Uhrzeit gebunden, nicht an das dunkle Design.
- **Sonne/Mond statt Schalter:** Die Wahl „Tagesansicht“ liegt nur im Speicher (Modulvariable), gilt höchstens 12 Stunden und überlebt Tab-Wechsel, aber keinen Neustart – nachts soll beim Öffnen immer zuerst die ruhige Ansicht kommen.
- **Ring = 3 Stunden:** Ein voller Ring heißt ungefähr „Zeit fürs nächste Stillen“; das ist eine grobe Orientierung, keine Empfehlung, und bleibt nach 3 Stunden voll.
- **Tab-Leiste bleibt in der Nachtansicht** (Mockup zeigt keine): Ohne sie käme man nachts nicht in den Verlauf.
- **Zeitleiste:** Positionen als Prozent des Tages in `logic/timeline.ts` (Unit-Tests), Darstellung mit Inline-`style` (CSP erlaubt `style-src 'unsafe-inline'`). Die Tageszähler-Leiste hat seit der Flasche vier Felder und bleibt mit `grid-auto-flow: column` einzeilig.

## 0.8.0 (Schalter, Platz, kein Zoom)

- **Tracker-Schalter in `kv`** (`trackers`), nicht in `localStorage`: Sie müssen nicht vor dem ersten Bild bekannt sein. „Alle Daten löschen“ setzt sie mit zurück. Sie sind nicht Teil der Sicherung (die Sicherung enthält Einträge und Profil; Einstellungen sind schnell neu gesetzt).
- **Ausschalten versteckt nur:** Einträge bleiben im Verlauf, im Export und beim Nachtragen wählbar – sonst wären alte Daten nach dem Ausschalten unsichtbar oder nicht mehr korrigierbar.
- **Mindestens ein Tracker bleibt an** (`sanitizeTrackers` stellt notfalls Stillen wieder an); ein leeres Heute ergibt keinen Sinn.
- **Nachtansicht nur mit Stillen:** Sie ist um „Zuletzt gestillt“ gebaut.
- **Zeitleisten-Schalter unter Darstellung**, nicht bei den Trackern: Er ändert die Ansicht, nicht was erfasst wird.
- **Kein Zoom** (Wunsch des Besitzers nach dem Test am Handy): bewusste Abweichung von WCAG 1.4.4. iOS Safari ignoriert `user-scalable=no` seit iOS 10, deshalb werden dort `gesturestart`/`gesturechange` abgefangen; nicht auf einem echten iPhone geprüft.
- **Weniger gestaucht:** Statuskarten mit Symbol neben der Beschriftung statt darüber, kleinere Abstände in Hero und Liste (Gap 12 statt 16), Dock-Knöpfe mit Symbol über Text. Bei 390 × 844 passt Heute (mit Flasche-Zähler und Zeitleiste) ohne Scrollen.

## 0.9.0 (Wochenansicht)

- **Im Verlauf, nicht als vierter Tab:** Tage und Woche sind zwei Sichten auf dieselben Einträge; der Umschalter „Tage | Woche“ hält die Tab-Leiste bei drei.
- **Kleine Balkendiagramme je Tracker** statt einer Tabelle oder eines gestapelten Diagramms: eine Einheit pro Diagramm (Anzahl, Stunden, ml), also nie zwei Skalen in einem Bild. Jede Karte hat ihre eigene Höhe nach dem größten Wert der Woche.
- **Wert über jedem Balken:** Sieben Balken auf dem Handy sind wenig; die Zahl ist das, was die Hebamme wissen will. Kein Tooltip, weil die App auf Touch läuft; die ganzen Sätze stehen als zugänglicher Name an jedem Balken (ersetzt die Tabellenansicht).
- **Schlaf als volle Stunden über dem Balken** („9h“, unter einer Stunde „<1h“), weil „9:25“ in einer schmalen Spalte nicht passt; der Durchschnitt zeigt Stunden und Minuten.
- **Durchschnitt über begonnene Tage:** Am Mittwoch teilt er durch 3, nicht durch 7, sonst wäre er bis Sonntag zu niedrig.
- **Woche beginnt am Montag** (Österreich). Die Wochenansicht öffnet immer auf der aktuellen Woche.

## 0.10.0 (Akzentfarben)

- **Nur die vier `--rose`-Tokens wechseln:** Alles, was „Akzent“ ist (Knöpfe, Schalter, Ring, Markierungen, Stillen-Farbe), hängt schon an diesen Tokens. Pfirsich, Lavendel und Himmelblau bleiben, weil sie Windel, Schlaf und Flasche bedeuten; deshalb gibt es keine Akzentfarbe, die einer dieser drei gleicht (Blau ist kräftiger als `--sky`, Lila kräftiger als `--lavender`).
- **`localStorage` statt `kv`:** wie das Design, damit `theme-init.js` den Akzent vor dem ersten Bild setzt und nichts rosé aufblitzt. Nicht Teil der Sicherung; „Alle Daten löschen“ setzt zurück.
- **Logo, App-Icon und Splash bleiben rosé:** Das ist die Marke; das Icon im Startbildschirm lässt sich ohnehin nicht pro Nutzerin umfärben.
- **Kontrast als Unit-Test aus der echten CSS:** `accent.test.ts` liest `tokens.css`, `settings.css` und `theme-init.js` und prüft je Akzent die Verhältnisse und dass Farbfläche, Browserleiste und Startskript dieselbe Farbe haben. Wer eine Farbe ändert, merkt es sofort.
- **Radiogruppe statt fünf Schalter:** genau eine Wahl; Pfeiltasten wechseln, nur die gewählte Fläche ist im Tab-Fokus. Farbe ist nie das einzige Merkmal: Name als zugänglicher Name, Ring und Häkchen an der gewählten, Name in der Zusatzzeile.

## 0.11.0 (Meilensteine)

- **Eigene Tabelle statt Eintragsart:** Meilensteine haben ein Datum statt einer Uhrzeit und keine Dauer; als Event würden sie Verlauf, Zähler und Wochenansicht stören. Dexie-Version 2 legt nur die neue Tabelle an, vorhandene Daten bleiben unberührt.
- **Vorschläge ohne Altersnormen:** Eine Liste „normal mit 4 Monaten“ verunsichert Eltern eher; die App ist ein Tagebuch, keine Vorsorgeuntersuchung. Die Reihenfolge folgt grob dem üblichen Ablauf.
- **Ein Vorschlag nur einmal:** Ihn erneut eintragen (z. B. nach dem Zusammenführen zweier Sicherungen) ändert den vorhandenen Eintrag.
- **Datum statt Zeitpunkt** (`YYYY-MM-DD`, lokal): „Erstes Lächeln am 20. Oktober“ reicht; keine Zeitzonenfragen beim Wiederherstellen.
- **Schalter standardmäßig an**, im Abschnitt „Was möchtest du festhalten?“, aber ohne Einfluss auf die Regel „mindestens ein Tracker an“.
- **Sicherung `schemaVersion: 3`:** Ältere Apps lehnen neue Dateien mit „aus einer neueren Version“ ab. Dateien ohne `milestones` lassen beim Ersetzen die Meilensteine auf dem Handy stehen (wie das Profil).
- **Tab-Labels 11 px bei vier Tabs**, damit „Einstellungen“ auf 360 px Breite nicht abgeschnitten wird (E2E-Test prüft das).

## 0.12.0 (UX-Bewertung umgesetzt)

Grundlage: eine externe KI-Bewertung anhand der Screenshots von 0.11.0. Jeder Punkt wurde am Code geprüft.

- **Sekundärtexte im Dunkelmodus nicht geändert:** „rechts · 22 Minuten“ (`--ink-soft` auf `--rose-tint`) hat schon 6,3:1, also über WCAG AA (4,5:1). Neu ist ein Unit-Test, der `--ink-soft` auf allen Kartenfarben, hell und dunkel, mit jeder Akzentfarbe gegen 4,5:1 prüft, damit das so bleibt.
- **L/R-Schalter:** Der echte Mangel war die nicht nächste Seite: ein gefüllter Kreis fast in Kartenfarbe (1,2:1 dunkel, 1,3:1 hell). Jetzt ein Ring in `--ink-soft` (≥ 4,5:1); die nächste Seite bekommt zusätzlich einen Doppelring. So unterscheiden sich beide auch ohne Farbe.
- **Stift auf den Karten statt Long-Press:** Rückgängig im Snackbar gab es schon, aber nur 6 Sekunden. Eine versteckte Geste müsste man erst erklären; der Stift ist sichtbar und öffnet denselben Editor wie der Verlauf (Bearbeiten und Löschen mit Rückgängig). Nur da, wo es einen Eintrag gibt; beim laufenden Stillen führt die Karte weiter zum Timer.
- **Laufend-Zustand:** Stillen hatte schon den laufenden Timer im Knopf. Neu sind Rand und blinkender Punkt auf der Stillen- und der Schlaf-Karte; bei „Bewegung reduzieren“ blinkt nichts.
- **Zeitleiste:** Balken 28 → 34 px, Punkte 9 → 13 px, „jetzt“ als 3 px breite Linie über den Balken hinaus, mit Kappe und Beschriftung; eine Stundenzahl, die zu nah daran liegt, macht Platz. Heute passt weiter ohne Scrollen auf 390 × 844.
- **Vibration:** 20 ms nach Speichern über die Knöpfe (auch in der Nachtansicht) und nach „Fertig“ beim Stillen. Nur Android; Safari auf dem iPhone kennt die Vibration API nicht, dort passiert nichts. Kein eigener Schalter: kurz genug, und die Systemeinstellung „Vibration aus“ gilt ohnehin.

## 0.13.0 (Vorbereitung Beta-Test)

Grundlage: Beta-Check vom 2026-11-15 (Tester außerhalb des Freundeskreises).

- **Feedback per `mailto:` statt Formular:** Die App bleibt ohne Netzwerkaufrufe (CSP `connect-src 'self'` unverändert). Der Entwurf geht an `kontakt@mraz.app` (dieselbe Adresse wie auf der Projektseite) und enthält nur Version, Build-Zeit, „installiert ja/nein“ und den User-Agent – keine Einträge, kein Babyname. Der Tester sieht alles vor dem Senden. Als Link (`<a>`), nicht als Knopf: Es ist ein Navigationsziel, und der Link ist testbar.
- **Hinweise unter „Über die App“ statt beim Erststart:** Testversion, „ersetzt keinen Rat von Hebamme, Ärztin oder Arzt“ und ein Satz zu Cloudflare (IP-Adresse beim Laden, nie Einträge). Der Erststart bleibt kurz. Das ist keine Rechtsberatung; ob für die öffentliche Adresse eine eigene Datenschutzerklärung oder Offenlegung nötig ist, entscheidet der Besitzer.
- **Unit-Test liest CSS mit normalisierten Zeilenenden:** Auf Windows mit `core.autocrlf=true` liegen die Dateien mit CRLF vor, `accent.test.ts` suchte `{\n` und schlug fehl.

## 0.14.0 (Englisch)

Auftrag des Besitzers über die Portfolio-Sitzung („Cant we implement an english mode fast?“), 2026-11-15. Baut auf `beta-vorbereitung` (0.13.0) auf, damit Version, Changelog und Texte nicht kollidieren.

- **Sprache fest pro Start, Umschalten = Neustart:** Viele Module legen beim Laden `Intl`-Formate mit `t.locale` an. Ein Neustart ist einfacher und sicherer als alles reaktiv zu machen; Einträge und ein laufendes Stillen überleben ihn (getestet).
- **Erkennung:** gespeicherte Wahl, sonst erste Handysprache `de`/`de-*` → Deutsch, alles andere → Englisch. `theme-init.js` setzt `<html lang>` vor dem ersten Bild (Splash-Text per CSS `:lang()`), `src/strings.ts` wählt dieselbe Sprache. Schlüssel `babytime-lang` in `localStorage` wie Design und Akzent; nicht in der Sicherung, „Alle Daten löschen“ setzt sie nicht zurück (Geräteeinstellung, keine persönlichen Daten).
- **Typ `Strings` aus den deutschen Texten abgeleitet** (Literaltypen verbreitert): fehlende oder zusätzliche Schlüssel in `strings.en.ts` brechen die Typprüfung; ein Unit-Test vergleicht zusätzlich Schlüssel, Art und Funktionsstellen zur Laufzeit.
- **Englisch `en-GB`:** 24-Stunden-Uhr und Tag-Monat-Reihenfolge passen zur bestehenden Darstellung. „Diaper“ statt „nappy“, weil international verständlicher.
- **„seit“ zweigeteilt:** Deutsch nutzt „seit“ für Uhrzeit und Dauer, Englisch braucht „since 14:12“ bzw. „for 25 min“; `en.time.since` erkennt die Uhrzeit.
- **Zeile „Sprache · Language“ zweisprachig, Optionen in ihrer eigenen Sprache** (Deutsch, English), damit man auch in der falschen Sprache zurückfindet.
- **Anleitung für neue Funktionen** (feste Regel des Besitzers): `ChangelogEntry.guide` mit Schritten und Knopf zum Ziel (Zeile in den Einstellungen wird angesprungen, fokussiert und kurz markiert). Im Popup nur die neueste Anleitung, damit es kurz bleibt; alle stehen dauerhaft unter „Was ist neu“. Rückwirkend auch für „Feedback senden“ (0.13.0).
- **Nicht übersetzt:** Manifest (`lang: de`, Name ist sprachneutral), `<meta name="description">`, Hash-Routen (`#/einstellungen`) und Dateinamen der Sicherung – nicht sichtbar oder sprachneutral.

## 0.14.1 (Audit: Lesbarkeit und Layout)

Grundlage: Audit vom 2026-11-15 (17 Screens × DE/EN × hell/dunkel × 360/375/412 px, automatische Prüfung auf Kontrast, Überlauf und Überlappung plus Textprüfung). Behoben wurden die Punkte, an denen etwas sichtbar bricht oder falsch gelesen werden kann.

- **Tageszähler in Dreierreihen:** Mit Flasche und Abpumpen standen fünf Felder in einer Zeile und überlappten sich bei 360 px. Jetzt drei pro Zeile, Flasche und Abpumpen rutschen in eine zweite Zeile (wie der Kommentar in `Chips.tsx` es schon vorsah). An solchen Tagen braucht Heute auf kleinen Handys etwas Scrollen.
- **Knopf beim laufenden Stillen „Läuft“ statt „Stillen läuft“:** passte bei 360 px nicht. Der rosa Stillen-Knopf und der Timer darunter geben den Zusammenhang; für Screenreader bleibt „Stillen läuft, …, zum Timer“.
- **„Zuletzt gestillt vor“ / „Since last feed“** über der großen Zahl, damit „42 Min“ nicht als Stilldauer gelesen wird; in der ersten Minute weiter „Zuletzt gestillt / gerade eben“. Die Zeile darunter nennt Dauer und Ende ausdrücklich („18 Minuten lang · bis 12:38“).
- **Nachtansicht mit „vor“:** „Zuletzt gestillt vor 2:05 Std“, „Letzte Windel vor 1:35 Std“. Ohne „vor“ sah 2:05 neben der Uhrzeit oben wie eine Uhrzeit aus. Deutsch einheitlich „Std“ statt gemischt „Std“/„h“.
- **Zahl und Einheit untrennbar:** geschütztes Leerzeichen (` `) in allen Zeit-, Alters- und Mengen-Texten beider Sprachen („vor 55 Min“, „11 Wochen alt“, „120 ml“). Tests suchen deshalb mit `\s` statt Leerzeichen.
- **„Automatisch“ im Sprachfeld** bei 360 px etwas kleiner, damit es in sein Drittel passt.
- Offen aus dem Audit (nicht in 0.14.1): englisch „Feed“ vs. „Breastfeed“, Begriffe rund um die Sicherung, alte Wege in „Was ist neu“, neutraler Nachtring, 11 px Tab-Beschriftung.

## 0.15.0 (Audit-Kleinigkeiten: Englisch und Sicherung)

- **„Breastfeed“ statt „Feed“** überall im englischen Modus (Knopf, Legende, Verlauf, Woche, Editor), weil „Feed“ neben „Bottle“ doppeldeutig ist. Tageszähler „4× breastfed“ wie „4× gestillt“. Damit das längere Wort bei 360 px passt, bekommt der Stillen-Knopf auf Englisch etwas mehr Breite (`:lang(en)`). Ein Unit-Test verbietet ein alleinstehendes „Feed“ in `strings.en.ts`.
- **„5 min ago“ statt „5 ago“** in den Zeit-Pillen; die Pillen dürfen dafür auf kleinen Handys zweizeilig werden. Deutsch bleibt „vor 5“.
- **„Diaper · wet + dirty“ statt „Diaper both“**, **„Average … per day“ statt „Ø“** (im Englischen unüblich; Deutsch behält „Ø“).
- **Ein Begriff für die Sicherung:** „Sicherung speichern“, „Sicherung mit Passwort“, „Sicherung wiederherstellen“, „Zuerst sichern“ (EN: Save backup, Backup with password, Restore backup, Back up first). „Exportieren“ kommt in der Oberfläche nicht mehr vor; der alte Was-ist-neu-Eintrag 0.13.0 nennt den neuen Namen.
- **„Lösche alte Sicherungen nach dem Wiederherstellen“ entfernt:** Wer danach das Handy verliert, hätte nichts mehr. Stattdessen: „Bewahre deine Sicherungen an einem sicheren Ort auf.“
- **Ersetzen, Zusammenführen und Alles löschen sagen, was betroffen ist:** Ersetzen tauscht Einträge, Meilensteine und Profil; Zusammenführen ergänzt Einträge und Meilensteine, das Profil bleibt; Alles löschen entfernt auch Meilensteine und Einstellungen (so arbeitet `backup.ts` schon seit 0.11.0).
- **Nachtring ohne Countdown** (Christophs Wahl): Er füllt sich nur beim laufenden Stillen, in denselben 15-Minuten-Runden wie der Timer; in Ruhe bleibt er leer. Bisher war er nach 3 Stunden voll, das wirkte wie ein Fütterplan, obwohl nach Bedarf gestillt wird.
- **Tab-Beschriftung 12 px ab 375 px Breite**, bei 360 px weiter 11 px, damit „Einstellungen“ ganz sichtbar bleibt (E2E prüft beide Breiten).
- Weiter offen: weitere alte Wege in „Was ist neu“, HSTS-Header.

## 0.15.2 (Sprache „System“ erkennt das Handy zuverlässiger)

Meldung des Besitzers, 2026-11-16: „Automatisch“ blieb auf Deutsch, obwohl das Handy auf Englisch steht.

- **Ursache:** Die Erkennung nahm `navigator.languages[0]`. Das ist die Sprachliste des Browsers für Webseiten (Accept-Language), nicht die Systemsprache. In Chrome für Android ist sie eine eigene Einstellung, die beim ersten Start angelegt wird und beim Umstellen des Handys auf Englisch nicht mitzieht; Deutsch bleibt dann vorne. Nicht auf dem echten Handy nachgemessen, aber die einzige Stelle, an der der Code vom System abweicht (gespeicherter Wert wird bei „Automatisch“ gelöscht, Service Worker liefert dieselbe Regel aus).
- **Lösung:** `phoneLanguages()` in `src/data/language.ts` stellt das Browser-Locale (`Intl.DateTimeFormat().resolvedOptions().locale`) vor die Webseiten-Liste. Es folgt der Sprache der Browser-Oberfläche, und die folgt auf Android und iOS der Systemsprache. `public/theme-init.js` nutzt dieselbe Reihenfolge. Folge: Wer das Handy auf Deutsch und nur die Webseiten-Sprache auf Englisch hat, bekommt jetzt Deutsch – passt zum Namen „System“.
- **„Automatisch“ heißt „System“** (beide Sprachen gleich). Der Hinweis darunter nennt die erkannte Sprache („System folgt der Sprache des Handys, gerade English“), damit eine falsche Erkennung sofort sichtbar ist.
- Die Anleitung von 0.14.0 in „Was ist neu“ nennt jetzt „System“; der Eintrag 0.15.1 bleibt wörtlich (beschreibt den damaligen Stand).
- E2E-Test bildet den Fehler nach: Locale Englisch, `navigator.languages` Deutsch → App auf Englisch.

## 0.16.0 (Kurze Einführung und Layout bei großer Schrift)

- **Fünf Karten statt Tour mit Pfeilen.** Je ein Bild, ein Titel, zwei Zeilen: Stillen, Windel/Flasche/Schlaf, Korrigieren mit „Rückgängig“ und Stift, Nachtansicht, Daten bleiben am Handy. Die Bilder sind aus den eigenen Icons und Farben gebaut (folgen Dunkel und Akzentfarbe), keine Grafikdateien.
- **Nur nach dem ersten Start.** `completeOnboarding` setzt `tutorialPending` im kv; „Überspringen“, „Los geht’s“, Escape oder Tippen daneben löschen es. Bestehende Nutzerinnen sehen sie nicht ungefragt, sondern über „Was ist neu“ (Anleitung „Zur Einführung“) und Einstellungen → Über die App → „So funktioniert Baby Time“.
- Die Einführung wartet, solange das Update-Popup oder der Stillbildschirm offen ist.
- **Große Schrift / 150 % Zoom in Chrome (Android):** Der Zoom verkleinert das CSS-Viewport auf etwa 256 px. Die Leiste unten bricht in zwei Reihen um statt Knöpfe zu überlappen; Statuskarten stellen unter 330 px die Beschriftung unter das Icon; in den Einstellungen fallen die kleinen Icons der Datenzeilen weg und die Profilkarte bricht um, damit Text nicht Buchstabe für Buchstabe umbricht. Geprüft per Screenshot bei 256 px Breite.
- E2E: ein Test für die Einführung (erscheint einmal, Weiter/Zurück, nicht nach Neustart, wieder aus den Einstellungen); Tests, die den ersten Start durchlaufen, überspringen sie mit `skipTutorial`.

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
| `wrangler` | Entwicklung | Skript `deploy` (§13.1) und Workflow `.github/workflows/deploy.yml` |

npm 11 blockiert die Install-Skripte von `esbuild` und `workerd` (nicht freigegeben). `esbuild` bezieht sein Binary über optionale Abhängigkeiten, `workerd` wird nur für `wrangler dev` gebraucht; Build und Deploy laufen ohne.

## Deployment über GitHub Actions (seit 0.15.1)

- **Merge auf `main` ist die Freigabe.** Der Workflow `.github/workflows/deploy.yml` prüft danach alles wie im README (Typecheck, Lint, Unit- und E2E-Tests, Audit, Build, `check:external`) und liefert nur bei Erfolg per `wrangler deploy` aus. Mit „Run workflow“ (auch in der GitHub-App) lässt sich ein Stand erneut ausliefern. So hängt das Ausliefern an keinem PC.
- **Claude darf auf ausdrücklichen Auftrag der Besitzerin auch selbst deployen** (`npm run deploy`), z. B. wenn die Action nicht läuft. Merges nur auf ihren Auftrag.
- Der lokale `npm run snapshot` läuft in der Action nicht; Rückgriff ist GitHub (jeder Stand ist ein Commit) bzw. Rollback im Cloudflare-Dashboard.
- Secrets im Repo: `CLOUDFLARE_API_TOKEN` (nur „Workers Scripts: Edit“) und `CLOUDFLARE_ACCOUNT_ID`. Das Token legt die Besitzerin selbst an.

## Öffentliches Repo (2026-11-22)

Auftrag des Besitzers: das GitHub-Repo öffentlich machen, Landingpage optional.

- **Lizenz MIT** (Vorschlag, leicht austauschbar: nur `LICENSE` und `license` in `package.json`). Schrift Plus Jakarta Sans bleibt OFL-1.1, Logo und Icons sind eigene SVGs.
- **README für die Öffentlichkeit in zwei Dateien:** `README.md` Englisch (GitHub zeigt sie als Startseite, internationales Publikum), `README.de.md` Deutsch, oben jeweils ein Sprachlink. GitHub kann nicht nach Browsersprache umschalten. Screenshots aus 0.16.0 je Sprache in `docs/screenshots/de/` und `en/` (Testdaten mit erfundenem Namen „Emma“). Die bisherige Entwickler-Anleitung steht unverändert in `docs/ENTWICKLUNG.md`.
- **Mockups nach `docs/design/mockups/`** verschoben (kein Leerzeichen und Gedankenstrich mehr im Pfad an der Wurzel).
- **CI für Pull Requests** (`.github/workflows/ci.yml`): dieselben Prüfungen wie beim Deploy, ohne Secrets, auch für Forks. `deploy.yml` läuft weiter nur auf `main` und nutzt das Environment `production`, damit die Cloudflare-Secrets dorthin wandern und auf `main` beschränkt werden können.
- **SECURITY.md** (private Meldung über GitHub oder `kontakt@mraz.app`), **CONTRIBUTING.md**, Issue-Vorlagen (Fehler, Idee; leere Issues aus), PR-Vorlage, **Dependabot** monatlich gebündelt.
- **Neues Repo mit umgeschriebener History** (Wahl des Besitzers): Das alte Repo heißt jetzt `babytime-archive` (privat, mit den PRs 1–22). Im neuen `babytime` tragen alle Commits die GitHub-noreply-Adresse statt der Gmail-Adresse; ein PR allein hätte das nicht gekonnt, weil GitHub die alten PR-Commits (`refs/pull/*`) aufhebt.
- **Keine eigene Landingpage:** Das README ist die Projektseite. Eine spätere Seite gehört nicht in die App (Service Worker, CSP, Daten hängen an `babytime.mraz.app`), sondern auf `mraz.app` oder GitHub Pages.

## 0.16.1 (Datenschutz und Offenlegung)

Auftrag des Besitzers, 2026-11-22: Datenschutzerklärung für das öffentliche Repo und die App.

- **In der App statt auf einer eigenen Website:** Einstellungen → Über die App → **Datenschutz** öffnet ein Sheet (Art. 13 DSGVO: Verantwortlicher, lokale Einträge, Cloudflare-Auslieferung mit IP-Logs, Browserspeicher ohne Cookies, Feedback-Mail, Rechte, Beschwerde bei der DSB). Offline erreichbar wie alles andere; Texte in DE und EN.
- **Betreiberdaten in `src/legal.ts`** (`OWNER`, `PRIVACY_UPDATED`). Die **Offenlegung nach § 25 Abs. 5 MedienG** (Name und Wohnort, ohne Straße) erscheint erst, wenn `OWNER.place` ausgefüllt ist. Der Besitzer trägt den Ort selbst ein. Keine Rechtsberatung.
- **Version 0.16.1** mit Was-ist-neu-Eintrag, aber ohne Anleitung (kein neues Werkzeug, nur ein Info-Text). Der E2E-Test zum englischen Popup prüft deshalb den 0.16.1-Eintrag statt des älteren 0.15.2-Satzes, der jetzt hinter die Grenze von fünf Punkten fällt.

## 0.17.0 (Einstellungen als Übersicht mit Unterseiten)

Auftrag des Besitzers, 2026-11-22: Die Einstellungen waren zu lang (etwa zwölf Handy-Bildschirme). Vorher Mockups in zwei Varianten (Kacheln, gruppierte Liste), gewählt hat er **B: gruppierte Liste**.

- **Unterseiten als eigene Routen** (`#/einstellungen/erfassen`, `/darstellung`, `/daten`, `/app`) statt Zustand in der Ansicht: Der Zurück-Knopf des Handys funktioniert, und Tests können sie direkt öffnen. Der Zurück-Knopf in der Seite nutzt die Browser-History, ohne History geht er zur Übersicht.
- **Design als eine Auswahl von drei** (Hell, Dunkel, Nachts) statt zwei Schaltern, die sich gegenseitig ausschalteten. Gespeichert wird wie bisher `babytime-theme` `light|dark|night`, also keine Migration.
- **Sprache als native Auswahlliste** statt drei Knöpfen: Sie passt in eine Zeile und bleibt bei großer Schrift lesbar, weil das Handy die Liste selbst zeigt. „System“ nennt in Klammern, was gerade gewählt ist.
- **Texte gekürzt:** Der Hinweis zur Sicherung ist ein Satz mit aufklappbarem „Mehr“ (`<details>`). Der Absatz zu Cloudflare und IP-Adresse steht nicht mehr in den Einstellungen, sondern nur noch in der Datenschutzerklärung (dort ausführlicher). Die Hinweise bei Feedback und Testversion sind kürzer.
- **Backup-Punkt** bei „Daten & Backup“ nach derselben Regel wie die Erinnerungskarte auf Heute (14 Tage), aber unabhängig davon, ob die Karte weggeklickt wurde. Der Text sagt zusätzlich, wann gesichert wurde.
- Kein „So geht's“ zu 0.17.0: Es gibt kein neues Werkzeug, nur einen neuen Aufbau.

## 0.18.0 (Babyfoto im Profil)

Wunsch des Besitzers, 2026-11-23: optionales Babyfoto, offline und datenschutzkonform. Mockups in `design-0.18.0`, freigegeben mit „Sieht gut aus“.

- **Im Profil statt eigener Tabelle:** Das Foto ist ein Feld `photo` im `kv`-Eintrag `profile`. Damit gehen Sicherung, Sicherung mit Passwort, Wiederherstellen und „Alle Daten löschen“ ohne neuen Code mit, und es braucht keine Dexie-Migration. Die Sicherungsdatei bleibt `schemaVersion` 3: Ältere Apps lassen das unbekannte Feld beim Import einfach weg (`sanitizeProfile`).
- **Klein und ohne Metadaten:** mittig quadratisch, 256 × 256 px, JPEG 0,85, als data-URL (etwa 20–40 KB). Neu zeichnen im Canvas entfernt EXIF/GPS zuverlässig, ohne eine Bibliothek. Beim Import wird nur `data:image/jpeg;base64,…` bis 200 000 Zeichen angenommen, alles andere verworfen (keine SVGs, keine fremden URLs). Die CSP erlaubt `img-src data:` schon.
- **Kein Zuschneide-Dialog:** Mittiger Ausschnitt reicht für ein rundes Bild und spart Bedienung mit einer Hand. Falls gewünscht, später nachrüstbar.
- **Speichern erst mit „Speichern“**, wie Name und Datum; Schließen verwirft auch ein neu gewähltes Foto.
- **„Ersetzen“ beim Wiederherstellen** ersetzt das ganze Profil, also auch das Foto (eine Sicherung ohne Foto entfernt es). Zusammenführen lässt das Profil wie bisher unverändert.
- **Avatar-Baukasten (§15)** bleibt offen und unabhängig: Ohne Foto gibt es weiter Anfangsbuchstaben bzw. Logo-Gesicht.
- **Tests ohne echte Fotos:** Unit- und E2E-Tests erzeugen ihre Bilder selbst (Canvas bzw. winzige PNG-Bytes).
