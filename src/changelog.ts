import type { Lang } from './data/language';

/** Text in every app language (0.14.0). */
export type Localized<T> = Record<Lang, T>;

/** Where a guide's button leads: a row in the settings, scrolled into view and focused. */
export type GuideTarget = 'language' | 'feedback';

/**
 * Short how-to for a new feature (owner's rule since 0.14.0): numbered steps and a button straight to it.
 * Shown in the update popup and, for good, under its version in "Was ist neu".
 */
export interface Guide {
  target: GuideTarget;
  text: Localized<{ steps: string[]; button: string }>;
}

/**
 * What changed, newest version first (spec 6.9). Rule: whoever raises the version in package.json adds
 * an entry here in the same step – a unit test fails otherwise. 3 to 5 short sentences per language, "du"/"you".
 * A new feature also gets a `guide`.
 */
export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  items: Localized<string[]>;
  guide?: Guide;
}

export const changelog: ChangelogEntry[] = [
  {
    version: '0.14.0',
    date: '2026-11-15',
    items: {
      de: [
        'Baby Time gibt es jetzt auch auf Englisch',
        'Die App folgt automatisch der Sprache deines Handys',
        'Du kannst die Sprache in den Einstellungen auch selbst wählen',
      ],
      en: [
        'Baby Time now speaks English',
        'The app follows your phone’s language automatically',
        'You can also pick the language yourself in the settings',
      ],
    },
    guide: {
      target: 'language',
      text: {
        de: {
          steps: ['Öffne Einstellungen → Darstellung', 'Tippe bei „Sprache · Language“ auf Deutsch, English oder Automatisch', 'Die App startet kurz neu, deine Einträge bleiben'],
          button: 'Zur Sprache',
        },
        en: {
          steps: ['Open Settings → Appearance', 'Under “Sprache · Language”, tap Deutsch, English or Automatic', 'The app restarts briefly, your entries stay'],
          button: 'Go to language',
        },
      },
    },
  },
  {
    version: '0.13.0',
    date: '2026-11-15',
    items: {
      de: [
        'Neu in den Einstellungen: „Feedback senden“ öffnet eine E-Mail mit Version und Gerät, du schickst sie selbst ab',
        'Unter „Über die App“ steht jetzt genauer, was mit deinen Daten passiert: Sie bleiben auf dem Handy',
        'Baby Time ist eine Testversion: Sichere deine Daten ab und zu über „Daten exportieren“',
      ],
      en: [
        'New in the settings: “Send feedback” opens an email with version and device, you send it yourself',
        '“About the app” now explains in more detail what happens to your data: it stays on your phone',
        'Baby Time is a test version: back up your data now and then with “Export data”',
      ],
    },
    guide: {
      target: 'feedback',
      text: {
        de: {
          steps: ['Öffne Einstellungen → Über die App', 'Tippe auf „Feedback senden“', 'Schreib kurz, was passiert ist, und tippe in deiner Mail-App auf Senden'],
          button: 'Zum Feedback',
        },
        en: {
          steps: ['Open Settings → About the app', 'Tap “Send feedback”', 'Briefly describe what happened and tap Send in your mail app'],
          button: 'Go to feedback',
        },
      },
    },
  },
  {
    version: '0.12.0',
    date: '2026-11-08',
    items: {
      de: [
        'Vertippt? Der kleine Stift auf den Karten von Heute öffnet den letzten Eintrag zum Bearbeiten oder Löschen',
        'Läuft Stillen oder Schlaf, hat die Karte einen farbigen Rand und einen blinkenden Punkt',
        '„Nächste Seite“: Die andere Seite ist jetzt ein Ring, die nächste deutlich hervorgehoben',
        'Die Zeitleiste ist höher, mit gut sichtbarer Markierung „jetzt“',
        'Auf Android-Handys vibriert es kurz, wenn ein Eintrag gespeichert ist',
      ],
      en: [
        'Mistyped? The small pencil on the Today cards opens the last entry to edit or delete it',
        'While a feed or sleep is running, its card has a coloured border and a blinking dot',
        '“Next side”: the other side is now a ring, the next one clearly highlighted',
        'The timeline is taller, with a clearly visible “now” mark',
        'On Android phones a short vibration confirms that an entry is saved',
      ],
    },
  },
  {
    version: '0.11.0',
    date: '2026-11-05',
    items: {
      de: [
        'Neuer Tab „Meilensteine“: Halte das erste Lächeln, den ersten Zahn und mehr mit Datum fest',
        'Vorschläge antippen oder eigene Meilensteine eintragen, gern mit Notiz',
        'Mit Geburtsdatum steht dabei, wie alt dein Baby war',
        'Meilensteine sind Teil der Sicherung',
        'Kein Bedarf? Einstellungen → Meilensteine ausschalten',
      ],
      en: [
        'New “Milestones” tab: capture the first smile, the first tooth and more, with a date',
        'Tap a suggestion or add your own milestones, with a note if you like',
        'With a date of birth, it shows how old your baby was',
        'Milestones are part of the backup',
        'Don’t need them? Settings → switch Milestones off',
      ],
    },
  },
  {
    version: '0.10.0',
    date: '2026-11-05',
    items: {
      de: [
        'Neu in den Einstellungen: Akzentfarbe – Rosé, Grün, Lila, Blau oder Orange',
        'Knöpfe, Schalter und Markierungen nehmen die Farbe sofort an, hell wie dunkel',
        'Alle Farben sind gut lesbar geprüft',
      ],
      en: [
        'New in the settings: accent colour – rosé, green, purple, blue or orange',
        'Buttons, switches and highlights take on the colour right away, light or dark',
        'All colours are checked for good readability',
      ],
    },
  },
  {
    version: '0.9.0',
    date: '2026-11-05',
    items: {
      de: [
        'Neu im Verlauf: die Wochenansicht, oben über „Woche“',
        'Für Stillen, Windeln, Schlaf und Milch je ein kleines Balkendiagramm von Montag bis Sonntag',
        'Dazu der Durchschnitt pro Tag, zum Beispiel für die Hebamme',
        'Mit den Pfeilen blätterst du zu früheren Wochen',
      ],
      en: [
        'New in the history: the week view, via “Week” at the top',
        'A small bar chart from Monday to Sunday for feeds, diapers, sleep and milk',
        'Plus the average per day, for example for your midwife',
        'Use the arrows to go back to earlier weeks',
      ],
    },
  },
  {
    version: '0.8.0',
    date: '2026-11-05',
    items: {
      de: [
        'Neu in den Einstellungen: „Was möchtest du festhalten?“ – Stillen, Flasche, Abpumpen, Windel und Schlaf einzeln ein- und ausschalten',
        'Ausgeschaltetes verschwindet von Heute, deine Einträge bleiben im Verlauf',
        'Die Zeitleiste auf Heute lässt sich ausblenden',
        'Heute ist luftiger: alles passt ohne Scrollen auf den Bildschirm, die Knöpfe haben Symbole',
        'Die App lässt sich nicht mehr versehentlich zoomen',
      ],
      en: [
        'New in the settings: “What do you want to track?” – switch breastfeeding, bottle, pumping, diaper and sleep on or off',
        'Anything switched off disappears from Today, your entries stay in the history',
        'The timeline on Today can be hidden',
        'Today is airier: everything fits on the screen without scrolling, the buttons have icons',
        'The app no longer zooms by accident',
      ],
    },
  },
  {
    version: '0.7.0',
    date: '2026-11-05',
    items: {
      de: [
        'Neu in den Einstellungen: „Nachts automatisch“ – von 20 bis 7 Uhr dunkel',
        'Nachts zeigt Heute eine ruhige Nachtansicht mit großem Ring und großen Knöpfen',
        'Mit der Sonne oben rechts kommst du zur gewohnten Ansicht, mit dem Mond zurück',
        'Neu auf Heute: eine Zeitleiste von 0 bis 24 Uhr mit Schlaf, Stillen, Windeln und Flasche',
      ],
      en: [
        'New in the settings: “Dark at night” – dark from 8 p.m. to 7 a.m.',
        'At night, Today shows a calm night view with a big ring and big buttons',
        'The sun at the top right takes you to the usual view, the moon brings you back',
        'New on Today: a timeline from midnight to midnight with sleep, feeds, diapers and bottles',
      ],
    },
  },
  {
    version: '0.6.0',
    date: '2026-11-05',
    items: {
      de: [
        'Neu: Flasche und Abpumpen, unten über den Knopf „Flasche“',
        'Menge mit Plus und Minus, dazu Muttermilch oder Pulvermilch bzw. die Seite',
        'Das Fenster merkt sich deine letzte Menge, meist reicht ein Tipp auf „Speichern“',
        'Heute und der Verlauf zeigen, wie viel Milch es am Tag war',
        'Bei den Neuerungen begrüßt dich jetzt ein lachendes Baby',
      ],
      en: [
        'New: bottle and pumping, via the “Bottle” button at the bottom',
        'Amount with plus and minus, plus breast milk or formula, or the side',
        'It remembers your last amount, so one tap on “Save” is usually enough',
        'Today and the history show how much milk there was each day',
        'A laughing baby now greets you with the news',
      ],
    },
  },
  {
    version: '0.5.0',
    date: '2026-11-05',
    items: {
      de: [
        'Läuft ein Stillen, zeigt Heute die Seite und unten „Stillen läuft“ mit Timer',
        'Die Tageszähler stehen jetzt in einer festen Leiste',
        'Windel auch „vor 5, 15 oder 30 Min“ eintragen, direkt im Windel-Fenster',
        'Beim Stillen siehst du die Zeit pro Seite, der Ring hat Markierungen alle 5 Minuten',
        'Im Verlauf: Tagessummen und der Abstand zwischen den Mahlzeiten',
      ],
      en: [
        'While a feed is running, Today shows the side and “Feeding” with a timer at the bottom',
        'The daily counters now sit in a fixed bar',
        'Log a diaper “5, 15 or 30 min ago” right in the diaper sheet',
        'While feeding you see the time per side, the ring has a mark every 5 minutes',
        'In the history: daily totals and the gap between feeds',
      ],
    },
  },
  {
    version: '0.4.3',
    date: '2026-11-05',
    items: {
      de: [
        'Neu in den Einstellungen: Sicherung mit Passwort exportieren',
        'Eine geschützte Sicherung lässt sich nur mit dem Passwort wiederherstellen',
        'Ohne Passwort gibt es keinen Weg zurück, also gut merken',
      ],
      en: [
        'New in the settings: export a backup with a password',
        'A protected backup can only be restored with the password',
        'Without the password there’s no way back, so keep it safe',
      ],
    },
  },
  {
    version: '0.4.2',
    date: '2026-10-21',
    items: {
      de: [
        'Das Geburtsdatum darf höchstens 24 Monate zurückliegen',
        'Das Alter steht jetzt in Wochen und Monaten statt in Tagen',
        'Bei einem zu alten Datum erscheint eine verständliche Meldung am Feld',
      ],
      en: [
        'The date of birth can be at most 24 months ago',
        'The age now shows in weeks and months instead of days',
        'A date that is too old shows a clear message at the field',
      ],
    },
  },
  {
    version: '0.4.1',
    date: '2026-10-21',
    items: {
      de: [
        'Vollbild auf Android, ohne helle Leiste am unteren Rand',
        'Dunkleres Startbild beim Öffnen der App',
        'Für beides die App einmal vom Startbildschirm löschen und neu installieren',
      ],
      en: [
        'Full screen on Android, without the light bar at the bottom',
        'Darker start screen when the app opens',
        'For both, remove the app from the home screen once and install it again',
      ],
    },
  },
  {
    version: '0.4.0',
    date: '2026-10-21',
    items: {
      de: [
        'Neuer Tab „Einstellungen“ mit Profil, Darstellung und Daten',
        'Du siehst, wann deine letzte Sicherung war, und wirst nach zwei Wochen erinnert',
        'Oben rechts auf Heute: Version antippen und nach Updates suchen',
        'Neue Version bereit? Ein Tipp auf „Update bereit“ startet sie',
      ],
      en: [
        'New “Settings” tab with profile, appearance and data',
        'You see when your last backup was and get a reminder after two weeks',
        'Top right on Today: tap the version to check for updates',
        'New version ready? One tap on “Update ready” starts it',
      ],
    },
  },
  {
    version: '0.3.1',
    date: '2026-10-21',
    items: {
      de: [
        'Helles Design ist jetzt immer der Standard',
        'Dunkles Design zum Einschalten: Verlauf → Info-Knopf → Dunkles Design',
        'Dunkles Design besser lesbar, mit farbigen Karten',
        'Versionsnummer oben rechts auf Heute',
      ],
      en: [
        'The light design is now always the default',
        'Dark design to switch on: History → info button → Dark design',
        'Dark design easier to read, with coloured cards',
        'Version number at the top right on Today',
      ],
    },
  },
  {
    version: '0.3.0',
    date: '2026-10-21',
    items: {
      de: [
        'Verlauf: Einträge ändern, löschen und nachtragen',
        'Dunkles Design für die Nacht, automatisch nach Handy-Einstellung',
        'Datensicherung als Datei: exportieren und wiederherstellen',
        'Name und Geburtsdatum deines Babys, beides freiwillig',
        'Schlaf zählt jetzt minutengenau',
      ],
      en: [
        'History: edit, delete and add entries later',
        'Dark design for the night, automatically following your phone',
        'Backup as a file: export and restore',
        'Your baby’s name and date of birth, both optional',
        'Sleep now counts to the minute',
      ],
    },
  },
  {
    version: '0.2.0',
    date: '2026-10-21',
    items: {
      de: [
        'Stillen mit Timer und Seitenwechsel',
        'Windel und Schlaf mit ein, zwei Taps eintragen',
        'Rückgängig, falls du dich vertippt hast',
        'Installierbar und auch offline nutzbar',
      ],
      en: [
        'Breastfeeding with timer and side switch',
        'Log diapers and sleep in one or two taps',
        'Undo, in case you mistyped',
        'Installable and usable offline',
      ],
    },
  },
];
