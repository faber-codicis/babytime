import { t } from '../strings.de';
import { Icon } from './icons';

interface DockProps {
  sleeping: boolean;
  onFeed: () => void;
  onDiaper: () => void;
  onSleep: () => void;
}

/** The three main actions, always within thumb reach at the bottom. */
export function DockButtons({ sleeping, onFeed, onDiaper, onSleep }: DockProps) {
  return (
    <nav class="dock" aria-label={t.today.actionsA11y}>
      <button type="button" class="dock-btn dock-btn--feed" onClick={onFeed}>
        <Icon name="drop" size={22} />
        {t.today.actionFeed}
      </button>
      <button type="button" class="dock-btn dock-btn--diaper" onClick={onDiaper}>
        {t.today.actionDiaper}
      </button>
      <button type="button" class="dock-btn dock-btn--sleep" onClick={onSleep}>
        {sleeping ? t.today.actionWake : t.today.actionSleep}
      </button>
    </nav>
  );
}
