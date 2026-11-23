# Test am Dev-Handy (23.11.2026)

Kurzer, wiederholbarer Schnelltest der installierbaren Web-App. Gemessen wurde auf einer **lokalen Dev-Instanz** (Schnappschuss aus Git, eigener Port, eigener Name und eigenes Symbol, keine Verbindung zur Live-Seite und zu keinem Server). Geprüftes Werkzeug liegt außerhalb dieses Repos.

## Stand der geprüften App
lokaler Build `dist` vom 16.11.2026 10:55 (nicht neu gebaut, nicht der Stand von `main`)

## Ergebnis
| Stufe | Wo | Ergebnis |
|---|---|---|
| 1 | Chrome am PC (ohne Fenster, Wegwerf-Profil, 360×800 mobil emuliert) | 12 OK, 0 Achtung, 4 Info |
| 2 | Chrome am Dev-Handy (Android 16, 360 px breit) | 12 OK, 0 Achtung, 5 Info |

Geprüft wurden: Seite lädt, Konsolenfehler (ohne `/api`, das am Dev-Server ohne Worker erwartet 404 liefert), Netzfehler, Service Worker, Manifest und Symbole (Größe wirklich dekodiert), Installierbarkeit laut Chrome, **zugängliche Namen aus dem Accessibility-Baum von Chrome**, Touch-Ziele unter 44 px, Seitenüberlauf bei 360 px, Sicherheits-Header, Ladedaten und Offline-Start.

Zugängliche Namen: 9 bedienbare Elemente im Accessibility-Baum (Stufe 1), 3 am Handy (Startansicht); keines ohne Namen.

## Hinweise zu diesem Lauf
- Es wurden bewusst **keine Screenshots** angefertigt (siehe CONTRIBUTING: keine Gesundheitsdaten und keine echten Namen in Screenshots oder Testdaten). Getestet wurde ohne Eingaben, nur die Startansicht.
- Geprüft wurde ein vorhandener Build, nicht der aktuelle Stand von `main`. Ein erneuter Lauf nach einem frischen Build ist sinnvoll.

## Nicht geprüft
- TalkBack-Verhalten, Fokusreihenfolge und Ansagen
- echte Touch-Bedienung, Gesten, Tastatur am Handy
- Funktionen mit Server (`/api/*`)
- Zustände nach Dialogen, Anmeldung oder Spielständen (nur die Startansicht)
- Installation als App, Akku und Speicher

## Wiederholen
Das Werkzeug `pwa-dev` (außerhalb der Repos) startet je App eine lokale Instanz aus dem gewünschten Git-Stand und schreibt einen Bericht mit Messwerten und Belegen. Bei Änderungen an Manifest, Service Worker oder Oberfläche den Lauf wiederholen und diese Notiz aktualisieren.