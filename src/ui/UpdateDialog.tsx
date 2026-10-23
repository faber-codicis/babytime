import type { ChangelogEntry } from '../changelog';
import { t } from '../strings.de';
import { Icon } from './icons';
import { Sheet } from './Sheet';

/** At most this many bullet points; the rest is behind "Alle Neuerungen ansehen". */
const MAX_ITEMS = 5;

/** Groups up to MAX_ITEMS items by version, newest first. */
export function limitItems(entries: readonly ChangelogEntry[]): { version: string; items: string[] }[] {
  const groups: { version: string; items: string[] }[] = [];
  let left = MAX_ITEMS;
  for (const entry of entries) {
    if (left <= 0) break;
    const items = entry.items.slice(0, left);
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
}

/** Update popup (spec 6.9): bottom sheet over Today, once per version. */
export function UpdateDialog({ entries, onDismiss, onShowAll }: UpdateDialogProps) {
  const groups = entries ? limitItems(entries) : [];
  const withHeadings = groups.length > 1;

  return (
    <Sheet open={Boolean(entries)} onClose={onDismiss} labelledBy="update-title">
      <div class="update-head">
        <span class="update-star" aria-hidden="true">
          <Icon name="star" size={24} />
        </span>
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

      <div class="sheet-actions">
        <button type="button" class="big-btn big-btn--rose" onClick={onDismiss}>
          {t.whatsNew.ok}
        </button>
        <button type="button" class="text-btn" onClick={onShowAll}>
          {t.whatsNew.all}
        </button>
      </div>
    </Sheet>
  );
}
