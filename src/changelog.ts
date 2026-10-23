/**
 * What changed, newest version first (spec 6.9). Rule: whoever raises the version in package.json adds
 * an entry here in the same step – a unit test fails otherwise. 3 to 5 short sentences, German, "du".
 */
export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  items: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '0.4.2',
    date: '2026-10-21',
    items: [
      'Das Geburtsdatum darf höchstens 24 Monate zurückliegen',
      'Das Alter steht jetzt in Wochen und Monaten statt in Tagen',
      'Bei einem zu alten Datum erscheint eine verständliche Meldung am Feld',
    ],
  },
  {
    version: '0.4.1',
    date: '2026-10-21',
    items: [
      'Vollbild auf Android, ohne helle Leiste am unteren Rand',
      'Dunkleres Startbild beim Öffnen der App',
      'Für beides die App einmal vom Startbildschirm löschen und neu installieren',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-10-21',
    items: [
      'Neuer Tab „Einstellungen“ mit Profil, Darstellung und Daten',
      'Du siehst, wann deine letzte Sicherung war, und wirst nach zwei Wochen erinnert',
      'Oben rechts auf Heute: Version antippen und nach Updates suchen',
      'Neue Version bereit? Ein Tipp auf „Update bereit“ startet sie',
    ],
  },
  {
    version: '0.3.1',
    date: '2026-10-21',
    items: [
      'Helles Design ist jetzt immer der Standard',
      'Dunkles Design zum Einschalten: Verlauf → Info-Knopf → Dunkles Design',
      'Dunkles Design besser lesbar, mit farbigen Karten',
      'Versionsnummer oben rechts auf Heute',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-10-21',
    items: [
      'Verlauf: Einträge ändern, löschen und nachtragen',
      'Dunkles Design für die Nacht, automatisch nach Handy-Einstellung',
      'Datensicherung als Datei: exportieren und wiederherstellen',
      'Name und Geburtsdatum deines Babys, beides freiwillig',
      'Schlaf zählt jetzt minutengenau',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-10-21',
    items: [
      'Stillen mit Timer und Seitenwechsel',
      'Windel und Schlaf mit ein, zwei Taps eintragen',
      'Rückgängig, falls du dich vertippt hast',
      'Installierbar und auch offline nutzbar',
    ],
  },
];
