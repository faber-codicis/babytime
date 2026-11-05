# Baby Time – spec.md (Testversion 0.2)

> Arbeitsauftrag für Claude Code. Ziel: eine **erste testbare Version** der PWA „Baby Time“, die eine frischgebackene Mutter nachts einhändig bedienen kann. Alles andere ist bewusst ausgeklammert (siehe „Nicht im Umfang“).

## 1. Kontext

- Persönliches Geschenk für eine Freundin mit Neugeborenem. Eine Nutzerin, **ein Kind, ein Gerät**.
- UI-Sprache: **Deutsch** (Österreich). Code und Bezeichner: Englisch.
- Nutzung: einhändig, oft nachts, müde. Wenige Taps, große Ziele, kein Nachdenken.
- Muss **offline** vollständig funktionieren und sich auf dem Home-Bildschirm installieren lassen (iPhone und Android).
- Keine Konten, kein Backend, keine Tracker, keine externen Requests zur Laufzeit (keine CDN-Fonts, keine Analytics).

## 2. Umfang

### Im Umfang (Testversion)

1. PWA-Grundgerüst: installierbar, offline, Safe-Area-fähig.
2. Tracker **Stillen** (Timer, Links/Rechts), **Windel** (nass/voll/beides), **Schlaf** (Start/Ende).
3. Screen **Heute**: „Zuletzt …“-Übersicht, nächste Stillseite, Tageszähler.
4. Screen **Verlauf (light)**: Tagesliste, Eintrag ändern, löschen, nachtragen.
5. **Erststart**: ein Screen, Babyname und Geburtsdatum, beides freiwillig.
6. **Dunkles Design** zum Einschalten (Standard: hell), siehe Abschnitt 4. *(Geändert auf Wunsch der Besitzerin, 2026-10-21; vorher automatisch nach System-Einstellung.)*
7. **Datensicherung**: Export und Import als JSON-Datei, dauerhaften Speicher anfragen.
8. **Installationshinweis** für iPhone-Safari (nicht installiert).
9. **Deployment-Konfiguration** (Cloudflare Worker mit statischen Dateien) und **Sicherheits-Härtung** (CSP, Import-Validierung, Abhängigkeitsregeln), siehe Abschnitt 13.
10. **Versionsanzeige und „Was ist neu“**: Version im Splash, auf Heute (Versions-Pille) und in den Einstellungen, Seite „Was ist neu“, **Popup einmalig beim ersten Start nach einem Update** (Abschnitt 6.9).
11. **Flasche und Abpumpen** (seit 0.6.0, Wunsch des Besitzers), siehe Abschnitt 6.11.

### Nicht im Umfang (nicht bauen, keine Platzhalter-UI)

Benachrichtigungen und Push, Konten, Sync, Partner-Zugang, Avatar-Baukasten, Meilensteine, Tracker-Schalter, Akzentfarben, Wochenansicht, Name der Mutter, mehrere Kinder, Kontakte-Zugriff, Standort.

## 2a. Lieferstufen (Reihenfolge verbindlich)

Der Auftrag wird in **zwei Stufen** geliefert. Stufe A ist ein vorführbarer Stand, den die Besitzerin so schnell wie möglich auf einem iPhone installieren und offline starten will. **Nach Stufe A anhalten, kurz berichten (was läuft, was fehlt, was getestet wurde) und auf Freigabe warten.** Erst dann Stufe B.

| Stufe | Umfang | Schritte in Abschnitt 11 |
| --- | --- | --- |
| **A: Demo-Stand** | Snapshot-Skript, PWA-Gerüst (installierbar, offline), Splash mit Version, Heute (ohne Tab-Leiste), Stillen, Windel, Schlaf mit Rückgängig, Deployment-Minimum | 0 bis 5 |
| **B: Rest der Testversion** | Verlauf, Erststart, dunkles Design, Export und Import, „Alle Daten löschen“, Update-Popup mit „Was ist neu“, Installationshinweis im Erststart, Tests, Sicherheitsprüfungen, README | 6 bis 8 |

**Stufe A im Einzelnen:**
- `npm run snapshot` funktioniert (Abschnitt 11, Schritt 0).
- Die App ist installierbar (Manifest, Icons, `apple-touch-icon`) und startet im Flugmodus mit allen Funktionen von Stufe A (Service Worker mit Precache).
- Splash zeigt „Version x.y.z“ (Abschnitt 6.0); die Version kommt aus `package.json`.
- Heute vollständig nach 6.2, mit Standardwerten statt Profil: ohne Erststart gilt „Dein Baby“, kein Alter, `onboarded` wird in Stufe A ignoriert.
- Stillen-Timer nach 6.3, Windel-Sheet nach 6.4, Schlaf nach 6.5, jeweils mit Snackbar und Rückgängig. Laufende Timer überleben Neustart und Handy-Neustart.
- `navigator.storage.persist()` wird beim Start einmal aufgerufen (Ergebnis ignorieren).
- Hell und Dunkel: In Stufe A genügt das helle Design. Die Tokens für Dunkel dürfen schon angelegt sein.
- Deployment-Minimum: `wrangler.jsonc`, Skript `deploy` (nie ausführen), `public/_headers` mit CSP, kurzes README mit dem Abschnitt „Auf dem Handy testen“ (Abschnitt 12). Das Deployen erledigt die Besitzerin selbst.
- Tests: Unit-Tests für Datenregeln, Zeit-Logik und „nächste Seite“; ein Playwright-Smoke-Test für den Offline-Start, wenn das ohne großen Aufwand geht, sonst in Stufe B.
- **Installationshinweis** (6.7) ist auf Wunsch der Besitzerin (2026-10-21) in Stufe A vorgezogen und erscheint oben auf Heute.
- **Nicht in Stufe A:** Verlauf (Tab und Screen), Erststart, Export, Import, „Alle Daten löschen“, Update-Popup, Seite „Was ist neu“. Es gibt dafür auch keine Platzhalter-Buttons. Da der Verlauf-Tab fehlt, hat Stufe A nur den Tab **Heute**; die Tab-Leiste darf in Stufe A ausgeblendet bleiben und kommt mit Stufe B.
- Stufe A hat keine Datensicherung. Das README vermerkt: „Demo-Stand, nur zum Ausprobieren, Einträge können verloren gehen.“ In der App selbst steht dazu kein Hinweis. Daten dürfen nur zurückgesetzt werden, wenn sich das Dexie-Schema ändert; dafür Migrationen vorsehen.

**Abnahme Stufe A:**
- [ ] Installation auf iPhone-Safari und Android-Chrome möglich; Start im Flugmodus mit allen Stufe-A-Funktionen.
- [ ] Stillen mit Seitenwechsel in höchstens 3 Taps, Windel in 2 Taps, Schlaf in 1 Tap.
- [ ] Laufender Timer überlebt App-Neustart.
- [ ] „Nächste Seite“ zeigt die Gegenseite des letzten abgeschlossenen Stillens.
- [ ] Rückgängig nach Windel und Schlaf funktioniert.
- [ ] Alle Touch-Ziele mindestens 44 px; keine externen Requests.
- [ ] `dist/` enthält `_headers`; keine CSP-Verstöße in der Konsole.
- [ ] `npm run snapshot` legt eine Sicherung an; kein `.git`, keine Tokens.

## 3. Tech-Stack (Entscheidung, nicht neu verhandeln)

| Bereich | Wahl |
| --- | --- |
| Build | Vite + TypeScript (strict) |
| UI | Preact (ohne Router-Bibliothek, Hash-Routing selbst, 2 Routen) |
| Speicher | IndexedDB über **Dexie** |
| PWA | **vite-plugin-pwa** (generateSW, Precache aller Assets) |
| Styling | Reines CSS mit Custom Properties (Design-Tokens), kein Tailwind |
| Schrift | **Plus Jakarta Sans** lokal gebündelt (`@fontsource/plus-jakarta-sans`, Gewichte 400, 500, 600, 700, 800) |
| Tests | Vitest (Logik), Playwright (Smoke, Offline) |
| Paketmanager | npm |
| Hosting | Cloudflare Worker mit statischen Dateien (`wrangler.jsonc`, **kein Worker-Code**), siehe Abschnitt 13 |

Abhängigkeiten minimal halten. Neue Pakete nur mit Begründung in `DECISIONS.md`.

## 4. Design-Tokens

Referenzbreite der Mockups: 390 px. Layout fluid bis 480 px, darüber zentrierte Spalte mit max. 480 px.

### Hell

| Token | Wert | Verwendung |
| --- | --- | --- |
| `--bg` | `#FBF3F1` | Seitenhintergrund |
| `--surface` | `#FFFFFF` | Karten, Dock, Navigation, Inputs |
| `--ink` | `#3A2630` | Haupttext |
| `--ink-soft` | `#6B5560` | Nebentext, inaktive Icons |
| `--rose` | `#B04A63` | Primärfarbe, Hauptbuttons |
| `--rose-ink` | `#80304A` | Text und Icons auf Rosé-Tönung |
| `--rose-tint` | `#F7DCE2` | Hero-Karte, aktive Nav-Pille |
| `--peach` / `--peach-ink` | `#FCE3D6` / `#6E301A` | Windel |
| `--lavender` / `--lavender-ink` | `#E9E3F3` / `#3F3166` | Schlaf |
| `--switch-off` | `#8F7C83` | Schalter „aus“ (Dunkles Design) |

### Dunkel (zum Einschalten)

Standard ist **immer hell**, unabhängig von der System-Einstellung. Das dunkle Design schaltet die Nutzerin in den Einstellungen (Abschnitt Darstellung, 6.10) mit dem Schalter **Dunkles Design** ein (Schalter-Look wie im Mockup „Einstellungen“). Die Wahl wird gemerkt, gilt ab dem ersten Bild (auch für den Splash) und wird durch „Alle Daten löschen“ zurückgesetzt. *(Geändert auf Wunsch der Besitzerin, 2026-10-21: Die erste Fassung folgte dem System und war schlecht lesbar.)*

Überarbeitete Tokens mit mehr Kontrast (Text auf jeder Fläche mindestens 6:1):

| Token | Wert |
| --- | --- |
| `--bg` | `#150D10` |
| `--surface` | `#261719` |
| `--surface-2` | `#301E22` |
| `--ink` | `#F6C2BA` |
| `--ink-soft` | `#D79C93` |
| `--rose` (Button-Fläche) | `#D9827A`, Text darauf `#1A0D0F` (6,7:1; seit 0.5.0 eine Stufe dunkler als `#F09A8F`, weil der Stillen-Button nachts die hellste Fläche war) |
| `--rose-tint` / `--rose-ink` | `#3D2129` / `#F7B3C2` |
| `--peach` / `--peach-ink` | `#3B2519` / `#F5C3A6` |
| `--lavender` / `--lavender-ink` | `#2B2339` / `#CFC3F2` |
| Karten | feine Kontur `rgba(246, 194, 186, 0.1)` statt Schatten |

Dunkel bewusst rötlich-gedämpft, **kein reines Weiß**, damit nachts nichts blendet.

### Form und Schrift

- Radien: Karten 28 bis 32 px, Buttons und Pillen 22 bis 34 px, Eingabefelder 22 px.
- Schatten weich: `0 6px 20px rgba(58,38,48,0.07)`, Dock `0 10px 30px rgba(58,38,48,0.12)`.
- Schrift: Plus Jakarta Sans. Große Zahlen 44 bis 64 px / 800 mit negativem Letter-Spacing (-1.5 bis -2.5 px). Fließtext 15 bis 17 px.
- **Alle** Touch-Ziele mindestens 44 × 44 px, Hauptaktionen 64 bis 68 px hoch.
- Kontrast mindestens 4.5:1 für Text. Keine Information nur über Farbe.

## 5. Datenmodell

```ts
type EventType = 'feed' | 'diaper' | 'sleep' | 'bottle' | 'pump'; // bottle, pump seit 0.6.0

interface BabyEvent {
  id: string;            // crypto.randomUUID()
  type: EventType;
  start: number;         // epoch ms
  end?: number;          // epoch ms; fehlt = läuft noch (nur feed und sleep)
  side?: 'left' | 'right';            // nur feed
  diaper?: 'wet' | 'dirty' | 'both';  // nur diaper
  amountMl?: number;                  // nur bottle und pump: ganze ml, 1 bis 1000
  milk?: 'breast' | 'formula';        // nur bottle
  pumpSide?: 'left' | 'right' | 'both'; // nur pump
  note?: string;
  createdAt: number;
  updatedAt: number;
}

interface Profile {
  babyName?: string;
  birthDate?: string;    // ISO-Datum YYYY-MM-DD
  onboarded: boolean;
}
```

Dexie-Schema: Tabelle `events: 'id, type, start'`, Tabelle `kv: 'key'` (Eintrag `profile`). Schema-Version 1, Migrationen vorsehen.

Regeln:
- Zeiten immer als epoch ms, Tagesgrenzen in **lokaler** Zeitzone des Geräts.
- Ein **Stillen-Event hat genau eine Seite**. Seite wechseln beendet das laufende Event und startet sofort ein neues mit der anderen Seite.
- Höchstens ein laufendes Stillen und ein laufender Schlaf gleichzeitig. Laufende Timer überleben Reload und App-Neustart (Zustand kommt aus der Datenbank, nicht aus dem Speicher).
- Windel-, Flaschen- und Abpump-Events haben keine Dauer (`end` fehlt, `start` = Zeitpunkt).
- Sicherungsdateien haben seit 0.6.0 `schemaVersion: 2`; Dateien mit Version 1 werden weiter gelesen. Das Dexie-Schema bleibt Version 1 (keine neuen Indizes).
- Alle Schreibzugriffe über ein Repository-Modul (`src/data/events.ts`), UI greift nie direkt auf Dexie zu.

## 6. Screens

Navigation: Tab-Leiste unten mit **3 Tabs: Heute, Verlauf und Einstellungen** (seit 0.4.0; vorher 2). Auf „Stillen läuft“, „Was ist neu“, Erststart und Splash ausgeblendet. Routen: `#/` (Heute), `#/verlauf`, `#/einstellungen`, `#/stillen`, `#/neu` (Was ist neu, ohne Tab-Leiste).

### 6.0 Splash (App-Start)

- Beim Kaltstart kurz (höchstens 1,2 s, nie künstlich verlängern, endet sobald die Datenbank bereit ist) ein Vollbild in `--rose`: Logo-Gesicht im Uhren-Ring (300 px), Wortmarke „Baby Time“ (46 px / 800), Tagline „Alles im Blick, auch um 3 Uhr nachts.“, unten drei Ladepunkte und **„Version x.y.z“** (13 px / 600).
- Umsetzung als statisches Element in `index.html` (sichtbar vor dem JS-Start), das nach dem Laden ausgeblendet wird (Überblendung unter 200 ms, bei `prefers-reduced-motion` ohne Animation). Versionsnummer wird beim Build eingesetzt, kein Laufzeit-Request.

### 6.1 Tab-Leiste

- Fest am unteren Rand, weiß, obere Ecken 28 px rund, Schatten nach oben. Padding unten `max(30px, env(safe-area-inset-bottom))`, **seitliches Padding nur 4 px**, damit auch das längste Label (Einstellungen, 12 px / 600) bei 390 px Breite in einen Tab passt (Tabs gleich breit, `flex: 1 1 0`, `min-width: 0`).
- Jeder Tab: `<button>` mit Icon (22 px, Strichstärke 2.2, abgerundete Enden) über Beschriftung (12 px). Mindesthöhe 56 px.
- Aktiv: Icon in Pille (56 × 32 px, `--rose-tint`, Icon `--rose-ink`), Beschriftung 700 in `--ink`, `aria-current="page"`. Inaktiv: Icon und Text `--ink-soft`, Gewicht 600.
- Icon Heute: `M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z`
- Icon Verlauf: `M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2`
- Icon Einstellungen (Regler): `M4 7h9M17 7h3M4 17h3M11 17h9M13 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0`. Der Tab heißt „Einstellungen“ (nicht „Mehr“). *(Ab 0.4.0 auf Wunsch der Besitzerin vorgezogen.)*
- **Ausbaustufe (später):** vier Tabs *Heute, Verlauf, Meilensteine, Einstellungen*; ist Meilensteine ausgeschaltet, bleibt es bei drei Tabs.

### 6.2 Heute

Von oben nach unten:

1. **Kopfzeile:** runder Avatar 48 px (Logo-Gesicht aus Abschnitt 9, Hintergrund `#F3C7B8`), daneben Name (18 px / 800; ohne Namen „Dein Baby“) und darunter „12 Tage alt · Mittwoch, 14:20“ (13 px). Das Alter nur, wenn `birthDate` gesetzt ist: in den ersten 14 Tagen „x Tage alt“ („heute geboren“ am Geburtstag), danach bis 3 volle Monate „x Wochen alt“, dann „x Monate alt“, ab 24 Monaten „x Jahre alt“ (seit 0.4.2).
2. **Hero-Karte** (`--rose-tint`, Radius 32): Kopfzeile „Zuletzt gestillt“ mit Tropfen-Icon in weißem Kreis; große Zeit „1 Std 40 Min“ seit **Ende** des letzten Stillens (läuft eins, „Stillt gerade · 07:42“); Zeile „rechts · 18 Minuten · um 12:40“; unten „Nächste Seite“ mit zwei Kreisen **L** und **R** (nächste Seite gefüllt in `--rose`, andere weiß). Nächste Seite = Gegenseite des letzten abgeschlossenen Stillens. Läuft ein Stillen, heißt die Zeile „Seite“ und hebt die gerade gestillte Seite hervor (seit 0.5.0; vorher stand dort „Nächste Seite“ und wirkte widersprüchlich). Ohne Eintrag: „Noch nichts eingetragen“ und L hervorgehoben.
3. **Zwei Karten** nebeneinander: **Windel** (`--peach`): „vor 35 Min“ und Art („nass“); **Schlaf** (`--lavender`): „schläft seit 25 Min“ oder „wach seit 40 Min“ (seit Ende des letzten Schlafs).
4. **Tageszähler** (seit 0.5.0 eine feste Leiste aus drei gleich breiten weißen Feldern statt loser Chips, damit nichts umbricht): große Zahl, kleines Label darunter – „6×“ gestillt, „5“ Windeln, „9:25“ Std Schlaf (unter einer Stunde „40“ Min Schlaf), gezählt seit 00:00 lokal. Schlafsumme in Stunden und Minuten (unter einer Stunde „40 Min Schlaf“), weil Neugeborene in vielen kurzen Etappen schlafen; laufender Schlaf zählt bis jetzt. (Geändert auf Wunsch der Besitzerin, 2026-10-21; vorher ganze Stunden.)
4a. **Update-Pille** oben rechts in der Kopfzeile: Seit 0.5.0 nur sichtbar, wenn eine neue Version bereit ist (rosé, ↻ **Update bereit**, Tippen startet neu); Version, Build-Zeitpunkt und „Nach Update suchen“ stehen in Einstellungen → Über die App. *Bis 0.4.2:* kleine Pille „v0.4.0“ (12 px / 700, `--ink-soft` auf `--surface`, Tippfläche ≥ 44 px). Tippen öffnet ein kleines Fenster (`role="dialog"`, Escape und Tippen außerhalb schließen, Fokus hinein und zurück) mit „Baby Time 0.4.0“, „Erstellt am <Build-Zeitpunkt>“, Statuszeile, Button **Nach Update suchen** und Link **Was ist neu**. Ist eine neue Version bereits aktiv (Service Worker übernommen), wird die Pille rosé mit ↻ **Update bereit**; Tippen startet die App neu. Nie automatisch neu laden. *(Ersetzt das zweizeilige Kästchen aus 0.3.1.)*
4b. **Sicherungs-Erinnerung** unter der Kopfzeile (seit 0.4.0): Karte „Zeit für eine Sicherung“ mit „Letzte Sicherung vor 16 Tagen“ bzw. „Noch keine Sicherung vorhanden.“, Button **Jetzt sichern** (Export wie in 6.8) und Schließen-Knopf. Erscheint, wenn die letzte Sicherung – ohne Sicherung: der älteste Eintrag – mindestens 14 Tage alt ist; nach dem Schließen frühestens nach weiteren 14 Tagen wieder. Nie, solange ein Stillen läuft.
5. **Aktions-Dock** (weiße Pille, Radius 36, Padding 10, Gap 8) mit drei Buttons: **Stillen** (breiter, `--rose`, weißer Text, Tropfen-Icon), **Windel** (`--peach`), **Schlaf** (`--lavender`, wechselt zu **Wach**, solange ein Schlaf läuft). Höhe 68 px. Läuft ein Stillen, zeigt der Stillen-Button zweizeilig „Stillen läuft“ (mit pulsierendem Punkt, ohne Animation bei reduzierter Bewegung) und den Timer und führt zurück zum Stillen-Screen (seit 0.5.0).
6. Tab-Leiste.

Relative Zeit: unter 1 Min „gerade eben“; unter 60 Min „vor 35 Min“; ab 60 Min „vor 1 Std 40 Min“; ab 24 Std „vor 2 Tagen“. Anzeige aktualisiert sich alle 30 Sekunden und bei `visibilitychange`.

### 6.3 Stillen läuft

- Kopf: Zurück-Button (44 px rund) und Titel „Stillen“.
- **Segmentschalter** „Links | Rechts“ (weißer Container, Radius 30, aktives Segment `--rose`). Vorauswahl = nächste Seite. Umschalten **beendet das laufende Event und startet ein neues** auf der anderen Seite.
- **Timer-Ring** 280 px: Kreisfläche `--rose-tint`, Fortschrittsring (Strichstärke 12, Rosé) für 15 Minuten pro Umlauf, danach neu beginnend; kleine Markierungen bei 0, 5 und 10 Minuten (seit 0.5.0). Mitte: „Linke Seite“, Zeit `mm:ss` (64 px / 800, tabellarische Ziffern), „gestartet um 14:12“.
- Zwei Felder „Links mm:ss | Rechts mm:ss“: Zeit pro Seite in diesem Stillen (nach einem Seitenwechsel zählen beide), aktive Seite rosé hinterlegt (seit 0.5.0).
- Karte „Letztes Mal rechts · 18 Min · vor 1 Std 40 Min“.
- Unten: **Abbrechen** (weiß, verwirft das laufende Event nach Rückfrage) und **Fertig** (`--rose`, breiter, setzt `end` und geht zurück zu Heute).
- Der Start geschieht beim Öffnen des Screens über den Stillen-Button (Event wird sofort angelegt). Bildschirm wach halten über Wake Lock API, falls verfügbar, sonst ignorieren.
- Keine Pause in der Testversion.

### 6.4 Windel

Tap auf **Windel** öffnet ein Bottom-Sheet mit drei großen Buttons **Nass**, **Voll**, **Beides** (je mindestens 64 px hoch, seit 0.5.0 mit Symbol: Tropfen, Kreis, beides). Darüber Zeit-Pillen **jetzt · vor 5 · vor 15 · vor 30** (Standard „jetzt“, bei jedem Öffnen zurückgesetzt; seit 0.5.0). Tap auf eine Art speichert sofort mit der gewählten Zeit und schließt; bei „vor x“ lautet die Snackbar „Windel gespeichert · vor 15 Min“. Danach Snackbar „Windel gespeichert · Rückgängig“ (6 Sekunden, Button mindestens 44 px). Schließen per Tap außerhalb.

### 6.5 Schlaf

Tap auf **Schlaf** legt ein Event mit `start = jetzt` an, der Button wird zu **Wach**. Tap auf **Wach** setzt `end = jetzt`. Snackbar mit Rückgängig wie bei Windel.

### 6.6 Verlauf (light)

- Titel „Verlauf“, rechts ein **+** zum Nachtragen. *(Bis 0.3.1 gab es daneben einen Icon-Button „Daten und Info“; dessen Inhalt steht seit 0.4.0 im Tab Einstellungen, 6.10.)*
- Liste gruppiert nach Tag, neueste zuerst. Tageskopf: „Heute“, „Gestern“, sonst „Mo, 19. Okt.“. Darunter (seit 0.5.0) die Tagessumme „8× gestillt · 6 Windeln · 14 Std Schlaf“, gezählt wie auf Heute (Schlaf über Mitternacht anteilig).
- Zeile (mindestens 64 px): farbiges Icon in Kreis (Tropfen rosé, Windel pfirsich, Mond lavendel), Titel („Stillen links · 18 Min“, „Windel nass“, „Schlaf · 2 Std 10 Min“), Uhrzeit rechts. Laufende Events zeigen statt der Dauer ein farbiges Abzeichen **läuft** (seit 0.5.0). Die erste Zeile jedes Stillens hat eine zweite Zeile „Abstand 2 Std 10 Min“: Beginn zu Beginn des vorigen Stillens; ab 12 Stunden entfällt sie (dann fehlen Einträge).
- Tap auf eine Zeile öffnet ein **Bearbeiten-Sheet**: Startzeit (`<input type="datetime-local">`), Endzeit (bei feed und sleep), Seite oder Windelart, Notiz, **Speichern** und **Löschen** (mit Rückfrage). Ende vor Start ist unzulässig (Fehlermeldung am Feld).
- **+ Nachtragen:** gleiches Sheet mit Typauswahl, Startzeit vorbelegt mit „jetzt“.
- Leerer Zustand: „Hier erscheint alles, was du einträgst.“

### 6.7 Erststart

Ein Screen ohne Tab-Leiste, nur beim ersten Start (`onboarded = false`):

- Herz-Icon in rosa Kreis, Titel „Herzlichen Glückwunsch!“, ein Satz („Baby Time merkt sich alles, damit dein Kopf frei bleibt.“).
- Feld „Wie heißt dein Baby? (freiwillig)“, Feld „Geburtsdatum (freiwillig)“ (`<input type="date">`). Erlaubt ist heute bis höchstens **24 Monate** zurück (`min`/`max` am Feld und Meldung am Feld bei Zukunft oder zu alt; seit 0.4.2 auf Wunsch der Besitzerin, weil die App für Babys und Kleinkinder gedacht ist). Ein bereits gespeichertes älteres Datum bleibt erhalten und wird nur beim Bearbeiten geprüft.
- Primärbutton **Los geht’s**, darunter Textbutton **Ohne Namen fortfahren**. Beide setzen `onboarded = true`. Alles später änderbar (Profil-Karte in den Einstellungen, 6.10). Beim Abschluss wird `lastSeenVersion` auf die aktuelle Version gesetzt, damit direkt danach **kein** Update-Popup erscheint.
- Beim ersten Start einmal `navigator.storage.persist()` aufrufen (Ergebnis ignorieren).
- Auf iPhone-Safari **ohne** Installation: oben Hinweiskarte mit Schließen-Button (Zustand gemerkt). Erkennung über `navigator.standalone` und `matchMedia('(display-mode: standalone)')`. Text (angepasst an iOS 26, wo „Teilen“ im Menü „•••“ liegt):
  - Titel: „Als App installieren“
  - Einleitung: „Dann funktioniert Baby Time auch offline und deine Einträge bleiben sicher gespeichert.“
  - Schritte: 1. „Tippe auf •••“ · 2. „Dann auf Teilen und „Zum Home-Bildschirm““ · 3. „„Als Web-App öffnen“ eingeschaltet lassen und auf „Hinzufügen“ tippen“
  - Die Karte erscheint auf dem ersten Screen nach dem Öffnen des Links: in Stufe A auf **Heute**, ab Stufe B zusätzlich im **Erststart**. Ein einmal geschlossener Hinweis erscheint nicht wieder (bis „Alle Daten löschen“).
  - **Android (Chrome):** dieselbe Karte mit Titel und Einleitung, statt der Schritte ein Button **Installieren** (64 px), der den Installationsdialog des Browsers öffnet (`beforeinstallprompt`). Die Karte erscheint nur, solange Chrome die Installation anbietet; Chromes eigene Installationsleiste wird dafür unterdrückt. Ergänzt auf Wunsch der Besitzerin (2026-10-21).

### 6.8 Datensicherung

- **Export:** JSON `{ app: 'babytime', schemaVersion: 1, exportedAt, profile, events: [...] }`. Dateiname `babytime-YYYY-MM-DD.json`. Bevorzugt Web Share API mit Datei (iOS), sonst Download-Link.
- **Export mit Passwort** (seit 0.4.3, optional): eigener Eintrag „Mit Passwort exportieren“. Passwort zweimal (mindestens 8 Zeichen), dann wird die Sicherung per WebCrypto verschlüsselt (PBKDF2-SHA256 mit 600 000 Runden, AES-GCM 256) und mit einem zweiten Tipp „Datei sichern“ übergeben. Datei `babytime-YYYY-MM-DD-verschluesselt.json` mit `{ app: 'babytime', encrypted: 1, kdf, iterations, salt, iv, data }`. Das Passwort wird nirgends gespeichert; ohne Passwort ist die Datei verloren.
- **Import:** Dateiauswahl, bei verschlüsselter Datei zuerst Passwortabfrage, Validierung (Pflichtfelder, Typen), Vorschau „123 Einträge“, Wahl **Ersetzen** oder **Zusammenführen** (nach `id`), Bestätigung. Fehlerhafte Datei: verständliche Meldung, nichts wird geändert.
- **Alle Daten löschen** (zum Beispiel nach dem Ausprobieren mit Testeinträgen): Eintrag in den Einstellungen (Abschnitt Daten, 6.10), abgesetzt von den anderen und in warnender Farbe (Text zusätzlich, nicht nur Farbe). Tap öffnet einen Rückfrage-Dialog: Titel „Alles löschen?“, Text „Alle Einträge und das Profil werden von diesem Handy gelöscht. Das lässt sich nicht rückgängig machen.“, Buttons **Zuerst exportieren** (öffnet den Export), **Abbrechen** (Standardfokus) und **Alles löschen**. Erst der letzte löscht alle `events` und alle `kv`-Einträge (Profil, `lastSeenVersion`, gemerkte Hinweise) und führt danach zum Erststart wie bei einer frischen Installation. Der Service Worker und die Caches bleiben unberührt (Offline-Betrieb funktioniert weiter). Ein Unit-Test prüft, dass nach dem Löschen beide Tabellen leer sind, ein E2E-Test den Weg über den Dialog.

### 6.9 Version und „Was ist neu“

**Quelle der Version:** `package.json` (`version`, SemVer, Start `0.2.0`). Vite reicht sie per `define` als Konstante `__APP_VERSION__` in den Build (kein Laufzeit-Request). `vite-plugin-pwa` bleibt bei `autoUpdate`.

**Änderungsliste:** `src/changelog.ts`, neueste Version zuerst:

```ts
export interface ChangelogEntry { version: string; date: string; /* YYYY-MM-DD */ items: string[]; }
export const changelog: ChangelogEntry[] = [
  { version: '0.2.0', date: '2026-10-21', items: [ /* 3 bis 5 kurze Sätze, Du-Form, Deutsch */ ] },
];
```

Regel: Wer die Version in `package.json` erhöht, ergänzt **im selben Schritt** einen Eintrag. Ein Unit-Test schlägt fehl, wenn `package.json#version` keinen Eintrag in `changelog` hat.

**Anzeige:**
1. **Splash:** „Version x.y.z“ (6.0).
2. **Versions-Pille auf Heute** (6.2, 4a) und **Einstellungen** (6.10, „Über die App“): „Baby Time x.y.z“, Build-Zeitpunkt, **Nach Update suchen**, Link **Was ist neu** → Route `#/neu`.
3. **Seite „Was ist neu“** (`#/neu`, Zurück-Button): eine Karte je Version, die aktuelle mit Pille „Aktuell“ und Datum, Aufzählung der `items`.
4. **Update-Popup** (der Kern dieses Abschnitts):
   - Beim Start, sobald `profile.onboarded` wahr ist, `lastSeenVersion` (Tabelle `kv`, Schlüssel `lastSeenVersion`) mit `__APP_VERSION__` vergleichen.
   - **Fehlt `lastSeenVersion`** (Erstinstallation oder Gerät vor diesem Feature): still auf die aktuelle Version setzen, **kein** Popup.
   - **Ist `lastSeenVersion` kleiner** (SemVer-Vergleich, nicht String-Vergleich): Popup anzeigen, mit den Einträgen aller Versionen **größer als `lastSeenVersion` und kleiner/gleich der aktuellen** (übersprungene Versionen werden zusammen gezeigt, jeweils mit Versionsüberschrift, wenn es mehr als eine ist).
   - Gestaltung als **Bottom-Sheet über Heute** mit abgedunkeltem Hintergrund: oben ein Banner im Look des Splash (rosé, im dunklen Design `--rose-tint`, Deko-Kreise und Punkte) mit dem **lachenden Baby** (Logo-Gesicht mit zugekniffenen Augen, weit offenem Mund, Händchen und Freude-Strichen; kichert zweimal kurz, ohne Bewegung bei reduzierter Bewegung; seit 0.5.0 statt des Sternen-Icons, Wunsch des Besitzers), Titel „Neu in Version x.y.z“, Untertitel „Das hat sich geändert“, Aufzählung (höchstens 5 Punkte, weitere über den Link), Hauptbutton **Alles klar** (64 px), Textbutton **Alle Neuerungen ansehen** (→ `#/neu`).
   - **Beide** Buttons und Schließen per Tap außerhalb oder Escape setzen `lastSeenVersion` sofort auf die aktuelle Version. Das Popup erscheint danach nie wieder für diese Version.
   - Nie unterbrechen: Läuft gerade ein Stillen-Timer (Route `#/stillen`), erscheint das Popup erst, wenn die Nutzerin auf Heute zurückkehrt. Pro Start höchstens einmal.
   - Dialog barrierefrei: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Fokus hinein und zurück, kein Ton.
   - Ein Unit-Test deckt ab: fehlender Wert (kein Popup), gleiche Version (kein Popup), kleinere Version (Popup), zwei übersprungene Versionen (beide gelistet), `0.10.0` > `0.9.0`.
   - Hinweis für die Entwicklung: Der Service Worker aktiviert ein Update erst beim nächsten Start, das Popup erscheint daher erst, wenn die neue Version tatsächlich läuft. Das ist gewollt.

### 6.10 Einstellungen (seit 0.4.0)

Eigener Tab `#/einstellungen` im Stil des Mockups „Einstellungen“, auf Wunsch der Besitzerin aus der Ausbaustufe vorgezogen. Von oben nach unten:

1. **Profil-Karte:** Avatar, Name (ohne Namen „Dein Baby“ und darunter „Name eintragen“), „09.10.2026 · 12 Tage alt“, runder Stift-Knopf `aria-label="Profil bearbeiten"` → Sheet mit Name und Geburtsdatum (wie Erststart).
2. **Darstellung:** Schalter **Dunkles Design** (`role="switch"`, ganze Zeile tippbar), siehe Abschnitt 4.
3. **Daten:** **Daten exportieren** mit Zusatzzeile „Letzte Sicherung: heute / gestern / vor 12 Tagen“ bzw. „Noch keine Sicherung“ (Zeitpunkt wird beim erfolgreichen Export in `kv` `lastExportAt` gemerkt), **Daten wiederherstellen**, **Mit Passwort exportieren**, Hinweis zur unverschlüsselten Datei, **Alle Daten löschen** in eigener Gruppe (6.8).
4. **Über die App:** „Baby Time x.y.z“, „Erstellt am …“, Statuszeile, **Nach Update suchen** (fragt nur den eigenen `sw.js` ab; Ergebnisse „Du hast die neueste Version.“, „Neue Version wird geladen …“, „Keine Verbindung. Versuch es später noch einmal.“; bei neuer Version **Jetzt neu starten**), Link **Was ist neu**; **Als App installieren** nur, solange nicht installiert (iOS: Schritte aus 6.7, Android: Button bzw. Hinweis auf das Chrome-Menü); Satz „Deine Einträge bleiben auf diesem Handy.“

Nicht in 0.4.0: Tracker-Schalter, Meilensteine, Akzentfarben, automatischer Nachtmodus, Benachrichtigungen.

### 6.11 Flasche und Abpumpen (seit 0.6.0)

- **Dock:** vierter Button **Flasche** (`--sky`, zugänglicher Name „Flasche oder Abpumpen“) zwischen Windel und Schlaf. Die drei kleinen Buttons haben 15 px Schrift, damit alles auf 360 px Breite passt.
- **Sheet:** Kopf mit Flaschen- bzw. Pumpen-Icon; Umschalter **Flasche | Abpumpen**; Mengenfeld „60 ml“ mit runden Buttons **−** / **+** (je 10 ml, 1 bis 1000 ml); bei Flasche **Muttermilch | Pulvermilch**, bei Abpumpen **Links | Rechts | Beide**; Zeit-Pillen **jetzt / vor 5 / vor 15 / vor 30** wie bei der Windel; Button **Speichern**. Alles startet mit dem letzten Eintrag (Menge, Inhalt, Seite, Flasche oder Abpumpen); ohne Eintrag 60 ml, Muttermilch, beide. Der übliche Fall braucht 2 Taps.
- Danach Snackbar „Flasche gespeichert · 90 ml“ bzw. „Abpumpen gespeichert · 120 ml“ mit Rückgängig.
- **Heute:** Die Tageszähler bekommen „150 ml Flasche“ bzw. „120 ml abgepumpt“ dazu, nur an Tagen mit solchen Einträgen (eine zweite Reihe der Leiste). Die Hero-Karte bleibt beim Stillen.
- **Verlauf:** Zeilen „Flasche · 90 ml Muttermilch“ und „Abpumpen beide · 120 ml“ (Icon in `--sky`), Tagessumme ergänzt „· 150 ml Flasche · 120 ml abgepumpt“. Bearbeiten und Nachtragen mit Feld „Menge in ml“ und der passenden Auswahl; die Art des Eintrags steht beim Nachtragen in zwei Reihen.

## 7. PWA-Anforderungen

- `manifest.webmanifest`: `name` „Baby Time“, `short_name` „Baby Time“, `lang` „de“, `display` „fullscreen“ (mit `display_override` fullscreen, standalone; seit 0.4.0 auf Wunsch der Besitzerin, damit Android die helle Navigationsleiste ausblendet – die Uhrzeit steht in der App), `start_url` „/“, `theme_color` `#B04A63`, `background_color` `#3D2129` (tiefes Rosé für das Android-Startbild, das dem hellen/dunklen Design nicht folgen kann; vorher `#FBF3F1`, hell; geändert auf Wunsch der Besitzerin), Icons 192 und 512 (`any`) plus 512 `maskable`.
- `apple-touch-icon` 180 × 180, `<meta name="apple-mobile-web-app-capable" content="yes">`, `viewport-fit=cover`, Status-Bar `default`.
- Service Worker: Precache aller gebauten Assets inklusive Schriften, Navigations-Fallback auf `index.html`. `registerType: 'autoUpdate'`.
- Icons aus dem SVG in Abschnitt 9 per Skript erzeugen (z. B. `sharp`), Skript unter `scripts/make-icons.mjs`. Das maskable-Icon: Hintergrund `#B04A63` vollflächig, Motiv auf 80 Prozent verkleinert (Safe Zone).
- Splash (iOS): `apple-touch-startup-image` ist optional und kommt nicht in diese Version.

## 8. Barrierefreiheit und Bedienung

- Echte `<button>`, `<a>`, `<input>` mit `<label>`; keine klickbaren `<div>`.
- Icon-only Buttons mit `aria-label`. Dekorative SVGs `aria-hidden="true"`.
- Sheets: Fokus hinein und zurück, Schließen per Tap außerhalb und Escape.
- Timer-Anzeige mit `aria-live="off"` (kein Vorlesen im Sekundentakt).
- `prefers-reduced-motion` respektieren, Animationen kurz (unter 200 ms).
- Keine Töne, keine Vibration.
- Alle UI-Texte zentral in `src/strings.de.ts`.

## 9. Logo (Quelle für Icons und Avatar)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="46" fill="#B04A63"/>
  <circle cx="100" cy="100" r="74" fill="#F7DCE2"/>
  <circle cx="44" cy="104" r="9" fill="#F5C4AE"/>
  <circle cx="156" cy="104" r="9" fill="#F5C4AE"/>
  <circle cx="100" cy="100" r="58" fill="#FBD9C7"/>
  <path d="M100 42 Q92 30 102 26 Q112 24 108 34" fill="none" stroke="#3A2630" stroke-width="4" stroke-linecap="round"/>
  <circle cx="68" cy="112" r="9" fill="#F4A6A0" opacity="0.7"/>
  <circle cx="132" cy="112" r="9" fill="#F4A6A0" opacity="0.7"/>
  <path d="M68 92 Q76 82 84 92" fill="none" stroke="#3A2630" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M116 92 Q124 82 132 92" fill="none" stroke="#3A2630" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M80 112 Q100 140 120 112 Z" fill="#8E2F47" stroke="#8E2F47" stroke-width="3" stroke-linejoin="round"/>
  <path d="M90 123 Q100 117 110 123 Q100 131 90 123 Z" fill="#F08A9B"/>
</svg>
```

Als `src/assets/logo.svg` ablegen. Für den Avatar in der Kopfzeile dasselbe Gesicht **ohne** das äußere Rechteck und mit Kreis `r=98` in `#F7DCE2` als Hintergrund verwenden.

Weitere Icons (Strich 2.2, `fill="none"`, 24 × 24 viewBox):

- Tropfen (Stillen): `M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z`
- Windel: `M4 7h16l-2 9a4 4 0 0 1-4 3h-4a4 4 0 0 1-4-3z`
- Mond (Schlaf): `M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z`
- Zurück: `M15 18l-6-6 6-6`
- Herz: `M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z`

## 10. Projektstruktur

```
babytime/
  spec.md                 (diese Datei)
  DECISIONS.md            (Entscheidungen und Abweichungen)
  README.md               (Start, Tests, Test auf dem Handy)
  index.html
  vite.config.ts
  wrangler.jsonc          (Cloudflare Worker mit Assets, Abschnitt 13)
  public/                 (Icons, manifest-Quelle, _headers)
  scripts/make-icons.mjs
  scripts/snapshot.mjs    (lokale Sicherung, Abschnitt 11)
  src/
    main.tsx
    app.tsx
    strings.de.ts
    changelog.ts            (Abschnitt 6.9)
    version.ts              (SemVer-Vergleich, Popup-Entscheidung)
    styles/tokens.css  base.css
    data/db.ts  events.ts  profile.ts  backup.ts
    logic/time.ts  stats.ts  nextSide.ts
    ui/ (Nav, HeroCard, DockButtons, Sheet, Snackbar, ...)
    views/ Today.tsx  Breastfeeding.tsx  History.tsx  Onboarding.tsx  WhatsNew.tsx
    ui/UpdateDialog.tsx  (Popup, Abschnitt 6.9)
    assets/logo.svg
  tests/ unit/  e2e/
```

## 11. Vorgehen für Claude Code

Arbeite in dieser Reihenfolge, nach jedem Schritt laufen Typecheck, Lint und Tests. **Git wird nicht verwendet**: kein `git init`, keine Commits, kein Remote, kein `.gitignore`-Zwang. Stattdessen gibt es lokale Sicherungen (Schritt 0).

0. **Sicherung statt Git:** `scripts/snapshot.mjs` anlegen und als `npm run snapshot` verfügbar machen. Es kopiert `src/`, `public/`, `scripts/`, `tests/`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `wrangler.jsonc` und `spec.md` nach `../babytime-snapshots/YYYY-MM-DD_HHMM_vX.Y.Z/` (außerhalb des Projektordners, ohne `node_modules`, `dist`, `.wrangler`, `.env*`). Ohne Abhängigkeiten, nur Node-Bordmittel (`fs.cpSync`). **Nach jedem abgeschlossenen Schritt** `npm run snapshot` ausführen. Behalten werden die letzten 20 Sicherungen, ältere löscht das Skript nur im eigenen Sicherungsordner.
1. **Gerüst:** Vite, TypeScript, Preact, PWA-Plugin, Tokens, Schrift lokal, Hash-Routing, Tab-Leiste, leere Views. Installierbar und offline startbar.
2. **Daten:** Dexie, Repository, Profil, Unit-Tests für Datenregeln (ein laufendes Event je Typ, Seitenwechsel).
3. **Logik:** `time.ts` (relative Zeit, Tagesgrenzen), `stats.ts` (Tageszähler, Schlafsumme), `nextSide.ts`, alles mit Unit-Tests.
4. **Heute:** Kopfzeile, Hero-Karte, Karten, Chips, Dock, Live-Aktualisierung.
5. **Erfassen:** Stillen-Screen, Windel-Sheet, Schlaf-Toggle, Snackbar mit Rückgängig.
**⏸ HALT nach Schritt 5 (Ende Stufe A, Abschnitt 2a): berichten und auf Freigabe warten.**

6. **Verlauf:** Liste, Bearbeiten-Sheet, Nachtragen, Löschen.
7. **Rest:** Erststart, dunkles Design, Export und Import, „Alle Daten löschen“, `storage.persist()`, Installationshinweis im Erststart, Splash mit Version, `changelog.ts`, Seite „Was ist neu“ und Update-Popup (Abschnitt 6.0 und 6.9).
8. **Abnahme:** Playwright-Smoke-Test inklusive Offline-Lauf, Deployment-Konfiguration und Sicherheitsprüfungen (Abschnitt 13), README mit Anleitung zum Testen auf dem Handy. **Nicht selbst deployen.**

Regeln:
- **Nichts bauen, was unter „Nicht im Umfang“ steht**, auch nicht als Platzhalter.
- Bei offenen Fragen selbst entscheiden und in `DECISIONS.md` mit einem Satz begründen, nicht anhalten.
- Keine Laufzeit-Requests nach außen. Nach dem Build prüfen, dass keine externe URL im Bundle steht.
- Kein Git verwenden, keine Tokens, Konto-IDs oder `.env`-Dateien anlegen, nicht deployen.
- Pixel-Treue zu den Beschreibungen in Abschnitt 4 und 6, aber lesbar und robust vor pixelgenau.

## 12. Tests auf dem Handy (in README.md dokumentieren)

Service Worker und Installation brauchen einen sicheren Kontext (HTTPS oder `localhost`). Eine Adresse wie `http://192.168.x.x:5173` im WLAN genügt dafür **nicht**.

| Ziel | Weg |
| --- | --- |
| Layout und Bedienung schnell prüfen | `npm run dev -- --host`, Handy im selben WLAN. Offline und Installation sind so nicht testbar. |
| Offline und PWA auf Android | USB-Debugging mit Port-Forwarding (`chrome://inspect`), dann ist `localhost` auf dem Handy erreichbar. |
| Offline und Installation auf dem iPhone | `npm run build && npm run preview -- --host` hinter einem HTTPS-Tunnel (z. B. Cloudflare Tunnel) oder eine nicht beworbene Vorschau-URL bei einem Hosting-Dienst. |
| Test durch die Freundin | Cloudflare Worker mit statischen Dateien (Abschnitt 13), URL nicht öffentlich verbreiten. |

## 13. Deployment und Sicherheit

Die App hat keinen Server, keine Konten und keine Daten außerhalb des Geräts. Die Risiken liegen in Abhängigkeiten, im Einschleusen von Code über Eingaben, im Zugriff auf die Konten und im Umgang mit Export-Dateien.

### 13.1 Deployment (Cloudflare Worker, nur statische Dateien)

- **Kein Worker-Code**, kein `main`, kein `run_worker_first`. Die Dateien aus `dist/` werden direkt ausgeliefert. Unbekannte Pfade liefern `index.html` (Fallback für die Single-Page-App).
- `wrangler.jsonc` im Projektstamm:

```jsonc
{
  "name": "babytime",
  "compatibility_date": "2026-10-01",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

- npm-Skripte: `build` (`tsc --noEmit && vite build`) und `deploy` (`npm run build && wrangler deploy`). Das Skript `deploy` wird **angelegt, aber nie ausgeführt**.
- **Claude Code deployt nicht** und legt keine Tokens, Konto-IDs oder `.env`-Dateien an. Anmeldung (`wrangler login`) und Deployment erledigt der Projektinhaber selbst.
- **Kein Git, kein GitHub, keine CI.** Die Sicherung läuft über `npm run snapshot` (Abschnitt 11, Schritt 0). Deployment ausschließlich manuell vom eigenen Rechner per `wrangler login` (Anmeldung im Browser, 2FA des Kontos bleibt aktiv) und `npm run deploy`. Es wird **kein API-Token** angelegt, Dependabot oder automatische Builds gibt es nicht. `npm audit` läuft deshalb von Hand vor jedem Deployment (Abschnitt 13.4).
- Ein Cloudflare-Rollback auf eine frühere Version ist im Dashboard (Workers & Pages → Worker → Deployments) oder per `wrangler rollback` möglich, Cloudflare hält die letzten 100 Versionen vor. Ob das bei Static Assets uneingeschränkt gilt, ist nicht dokumentiert: im README nur als „zu prüfen“ vermerken, **nicht** als Garantie. Verlässlicher Weg ist die lokale Sicherung plus erneutes Deployment.
- Vor jedem Deployment: Version in `package.json` erhöhen und Eintrag in `src/changelog.ts` ergänzen (Abschnitt 6.9), sonst erscheint kein Popup.
- Zugang: Standard ist eine nicht verlinkte `*.workers.dev`-Adresse. Ein Zugangsschutz (Cloudflare Access) ist optional und **nicht** Teil dieses Auftrags.
- Cloudflare Web Analytics bleibt **aus**. Im README vermerken.

### 13.2 `public/_headers`

Wird beim Build nach `dist/` kopiert. Die Datei gilt nur für ausgelieferte Dateien, nicht für Antworten von Worker-Code (den es hier nicht gibt).

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()

/index.html
  Cache-Control: no-cache

/sw.js
  Cache-Control: no-cache

/manifest.webmanifest
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

- `style-src 'unsafe-inline'` ist wegen Inline-Styles nötig. In `DECISIONS.md` vermerken, alle anderen Direktiven bleiben streng.
- Nach dem Build prüfen: keine CSP-Verstöße in der Browser-Konsole, Installation und Offline-Betrieb funktionieren weiterhin. Weicht der Dateiname des Service Workers ab, die Pfade in `_headers` anpassen.

### 13.3 Code-Regeln

- Verboten: `innerHTML`, `outerHTML`, `dangerouslySetInnerHTML`, `document.write`, `eval`, `new Function`, `setTimeout` mit String. Per ESLint absichern (`no-restricted-properties`, `no-eval`, `no-implied-eval`) und im Lint-Lauf prüfen.
- Alle Nutzereingaben (Notizen, Namen) werden nur als Text angezeigt. Notizen höchstens 500 Zeichen, Babyname höchstens 60 Zeichen.
- Keine externen Requests, keine Drittanbieter-Skripte, keine eingebetteten Frames. Nach dem Build prüfen, dass `dist/` keine externen URLs enthält (Ausnahme: XML-Namensräume wie `http://www.w3.org/2000/svg`). Ein Skript `npm run check:external` übernimmt das.

### 13.4 Abhängigkeiten

- Nur die in Abschnitt 3 genannten Pakete, jedes weitere mit Begründung in `DECISIONS.md`. Laufzeit- und Entwicklungs-Abhängigkeiten sauber trennen.
- `package-lock.json` im Projekt behalten (nicht löschen), Installation mit `npm ci`.
- Vor jedem Deployment: `npm audit --omit=dev`. Hohe oder kritische Funde beheben oder in `DECISIONS.md` begründen.
- Jede Änderung an `package.json` (Paket, Version, Grund) kurz in `DECISIONS.md` festhalten.

### 13.5 Import und Export

- Import: maximale Dateigröße 10 MB, höchstens 100 000 Einträge. Jeder Eintrag wird **explizit** geprüft: `id` als UUID, `type` aus der festen Liste, `start` und `end` als endliche Zahlen mit `end >= start`, `side` und `diaper` nur mit erlaubten Werten, `note` als String mit Längengrenze. Unbekannte Felder werden verworfen.
- Neue Objekte werden aus den geprüften Feldern **neu aufgebaut**, nie per Spread aus dem geparsten JSON (Schutz vor `__proto__` und `constructor`). Bei einem einzigen ungültigen Eintrag: Import abbrechen, nichts ändern, verständliche Meldung.
- Export: Hinweis, dass die normale Datei unverschlüsselt ist und nach dem Wiederherstellen gelöscht werden sollte; optional Export mit Passwort (6.8).
- HTTP-Header: zusätzlich `Strict-Transport-Security` (eigene Domain).

### 13.6 Notfall

- Service Worker mit `autoUpdate` (Abschnitt 7) holt neue Versionen beim nächsten Start. Das README beschreibt den Notfall: sofort neu deployen. Hilft das nicht, einen Build ausliefern, dessen `sw.js` sich selbst deregistriert (`self.registration.unregister()`) und Caches leert.

### 13.7 Datenschutz

- Alle Einträge bleiben auf dem Gerät, es gibt keinen Upload und keine Weitergabe. Das steht in einem kurzen Satz im README und im Erststart-Screen („Deine Einträge bleiben auf diesem Handy.“).

## 14. Abnahmekriterien (Stufe B, gesamte Testversion, fertig wenn …)

Die Kriterien für Stufe A stehen in Abschnitt 2a. Sie müssen weiterhin gelten.


- [ ] App lässt sich auf iPhone und Android installieren und startet im Flugmodus mit allen Funktionen.
- [ ] Ein Stillen mit Seitenwechsel ist in höchstens 3 Taps erfasst; Windel in 2 Taps; Schlaf in 1 Tap.
- [ ] Laufender Timer überlebt App-Neustart und Handy-Neustart.
- [ ] „Nächste Seite“ zeigt korrekt die Gegenseite des letzten abgeschlossenen Stillens.
- [ ] Fehleingabe lässt sich im Verlauf in höchstens 3 Taps ändern oder löschen; Rückgängig nach Windel und Schlaf funktioniert.
- [ ] Ohne Babyname erscheint „Dein Baby“ überall; Erststart lässt sich ohne Eingabe abschließen.
- [ ] Standard ist hell; das dunkle Design lässt sich in den Einstellungen einschalten, bleibt gemerkt und hat keine reinen Weißflächen.
- [ ] Export, dann Import in einer frischen Installation stellt alle Einträge wieder her.
- [ ] „Alle Daten löschen“ verlangt eine Rückfrage, leert danach alle Daten und führt zum Erststart; Name und Geburtsdatum sind dort weiterhin freiwillig.
- [ ] Alle Touch-Ziele sind mindestens 44 px, Kontrast mindestens 4.5:1, Bedienung per Tastatur möglich.
- [ ] Keine externen Requests (Netzwerk-Tab leer nach dem ersten Laden).
- [ ] Unit- und E2E-Tests laufen grün.
- [ ] `dist/` enthält `_headers`, die CSP ist aktiv und erzeugt keine Verstöße in der Konsole.
- [ ] `npm audit --omit=dev` meldet keine hohen oder kritischen Funde, `npm run check:external` ist grün.
- [ ] Der Lint-Lauf schlägt bei `innerHTML`, `dangerouslySetInnerHTML` und `eval` an.
- [ ] Eine manipulierte Import-Datei (falsche Typen, riesige Datei, Schlüssel `__proto__`) wird abgelehnt und verändert keine Daten.
- [ ] `wrangler.jsonc` und das Skript `deploy` existieren, im Projektordner liegen keine Tokens oder `.env`-Dateien.
- [ ] Es gibt kein `.git`-Verzeichnis; `npm run snapshot` legt eine Sicherung außerhalb des Projektordners an.
- [ ] Splash, Versions-Pille und Einstellungen zeigen die Version aus `package.json`; „Was ist neu“ ist über `#/neu` erreichbar.
- [ ] Update-Popup: Nach dem Erststart kein Popup; nach Erhöhung der Version (Build, Neustart) erscheint es **genau einmal**, danach nicht mehr; übersprungene Versionen werden zusammen gezeigt.
- [ ] Nirgends steht „Gebaut mit Liebe“ oder „Mit Liebe gebaut“.

## 15. Danach (nicht jetzt)

Avatar-Baukasten, Meilensteine, Tracker-Schalter, Akzentfarben, Nachtmodus-Ring, vollständige Einstellungen, Verlauf mit Wochenansicht, Benachrichtigungen (Web Push mit Server, frühestens Version 1.1).
