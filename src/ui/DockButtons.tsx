import { t } from '../strings.de';
import { Icon } from './icons';

interface DockProps {
  sleeping: boolean;
  /** Timer text ("04:12") while a feed runs; the feed button then leads back to the timer. */
  feedTimer?: string | undefined;
  onFeed: () => void;
  onDiaper: () => void;
  onBottle: () => void;
  onSleep: () => void;
}

/** The main actions, always within thumb reach at the bottom (Flasche since 0.6.0). */
export function DockButtons({ sleeping, feedTimer, onFeed, onDiaper, onBottle, onSleep }: DockProps) {
  return (
    <nav class="dock" aria-label={t.today.actionsA11y}>
      {feedTimer ? (
        <button
          type="button"
          class="dock-btn dock-btn--feed dock-btn--running"
          aria-label={t.today.actionFeedRunningA11y(feedTimer)}
          onClick={onFeed}
        >
          <span class="dock-run-label" aria-hidden="true">
            <span class="dock-run-dot" />
            {t.today.actionFeedRunning}
          </span>
          <span class="dock-run-time" aria-hidden="true">
            {feedTimer}
          </span>
        </button>
      ) : (
        <button type="button" class="dock-btn dock-btn--feed" onClick={onFeed}>
          <Icon name="drop" size={22} />
          {t.today.actionFeed}
        </button>
      )}
      <button type="button" class="dock-btn dock-btn--diaper" onClick={onDiaper}>
        {t.today.actionDiaper}
      </button>
      <button type="button" class="dock-btn dock-btn--bottle" aria-label={t.today.actionBottleA11y} onClick={onBottle}>
        {t.today.actionBottle}
      </button>
      <button type="button" class="dock-btn dock-btn--sleep" onClick={onSleep}>
        {sleeping ? t.today.actionWake : t.today.actionSleep}
      </button>
    </nav>
  );
}
