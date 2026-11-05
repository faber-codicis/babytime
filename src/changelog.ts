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
    version: '0.8.0',
    date: '2026-11-05',
    items: [
      'Neu in den Einstellungen: „Was möchtest du festhalten?“ – Stillen, Flasche, Abpumpen, Windel und Schlaf einzeln ein- und ausschalten',
      'Ausgeschaltetes verschwindet von Heute, deine Einträge bleiben im Verlauf',
      'Die Zeitleiste auf Heute lässt sich ausblenden',
      'Heute ist luftiger: alles passt ohne Scrollen auf den Bildschirm, die Knöpfe haben Symbole',
      'Die App lässt sich nicht mehr versehentlich zoomen',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-11-05',
    items: [
      'Neu in den Einstellungen: „Nachts automatisch“ – von 20 bis 7 Uhr dunkel',
      'Nachts zeigt Heute eine ruhige Nachtansicht mit großem Ring und großen Knöpfen',
      'Mit der Sonne oben rechts kommst du zur gewohnten Ansicht, mit dem Mond zurück',
      'Neu auf Heute: eine Zeitleiste von 0 bis 24 Uhr mit Schlaf, Stillen, Windeln und Flasche',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-11-05',
    items: [
      'Neu: Flasche und Abpumpen, unten über den Knopf „Flasche“',
      'Menge mit Plus und Minus, dazu Muttermilch oder Pulvermilch bzw. die Seite',
      'Das Fenster merkt sich deine letzte Menge, meist reicht ein Tipp auf „Speichern“',
      'Heute und der Verlauf zeigen, wie viel Milch es am Tag war',
      'Bei den Neuerungen begrüßt dich jetzt ein lachendes Baby',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-11-05',
    items: [
      'Läuft ein Stillen, zeigt Heute die Seite und unten „Stillen läuft“ mit Timer',
      'Die Tageszähler stehen jetzt in einer festen Leiste',
      'Windel auch „vor 5, 15 oder 30 Min“ eintragen, direkt im Windel-Fenster',
      'Beim Stillen siehst du die Zeit pro Seite, der Ring hat Markierungen alle 5 Minuten',
      'Im Verlauf: Tagessummen und der Abstand zwischen den Mahlzeiten',
    ],
  },
  {
    version: '0.4.3',
    date: '2026-11-05',
    items: [
      'Neu in den Einstellungen: Sicherung mit Passwort exportieren',
      'Eine geschützte Sicherung lässt sich nur mit dem Passwort wiederherstellen',
      'Ohne Passwort gibt es keinen Weg zurück, also gut merken',
    ],
  },
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
