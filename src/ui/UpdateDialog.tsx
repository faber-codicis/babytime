import type { ChangelogEntry, GuideTarget } from '../changelog';
import { lang, t } from '../strings';
import { GuideCard } from './Guide';
import { NewsHero } from './NewsHero';
import { Sheet } from './Sheet';

/** At most this many bullet points; the rest is behind "Alle Neuerungen ansehen". */
const MAX_ITEMS = 5;

/** Groups up to MAX_ITEMS items by version, newest first. */
export function limitItems(entries: readonly ChangelogEntry[]): { version: string; items: string[] }[] {
  const groups: { version: string; items: string[] }[] = [];
  let left = MAX_ITEMS;
  for (const entry of entries) {
    if (left <= 0) break;
    const items = entry.items[lang].slice(0, left);
    left -= items.length;
    groups.push({ version: entry.version, items });
  }
  return groups;
}

interface UpdateDialogProps {
  entries: readonly ChangelogEntry[] | undefined;
  /** "Alles klar", tap outside or Escape. */
  onDismiss: () => void;
  /** "Alle Neuerungen ansehen". */
  onShowAll: () => void;
  /** The guide's button: close and go to the feature. */
  onGuide: (target: GuideTarget) => void;
}

/** Update popup (spec 6.9): bottom sheet over Today, once per version. */
export function UpdateDialog({ entries, onDismiss, onShowAll, onGuide }: UpdateDialogProps) {
  const groups = entries ? limitItems(entries) : [];
  // Only the newest guide keeps the popup short; every guide stays under its version in "Was ist neu".
  const guide = entries?.find((entry) => entry.guide)?.guide;
  const withHeadings = groups.length > 1;

  return (
    <Sheet open={Boolean(entries)} onClose={onDismiss} labelledBy="update-title">
      <NewsHero compact />
      <div class="update-head">
        <div>
          <h2 id="update-title" class="sheet-title">
            {t.whatsNew.popupTitle(__APP_VERSION__)}
          </h2>
          <p class="update-subtitle">{t.whatsNew.popupSubtitle}</p>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.version}>
          {withHeadings && <h3 class="update-version">{t.whatsNew.version(group.version)}</h3>}
          <ul class="news-list">
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      {guide && <GuideCard guide={guide} onGo={() => onGuide(guide.target)} />}

      <div class="sheet-actions">
        {/* Default focus stays on "Alles klar", even with a guide button above it (0.14.0). */}
        <button type="button" class="big-btn big-btn--rose" data-autofocus onClick={onDismiss}>
          {t.whatsNew.ok}
        </button>
        <button type="button" class="text-btn" onClick={onShowAll}>
          {t.whatsNew.all}
        </button>
      </div>
    </Sheet>
  );
}
