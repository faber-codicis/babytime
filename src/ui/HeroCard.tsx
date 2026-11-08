import type { TodayData } from '../data/overview';
import type { BabyEvent, Side } from '../data/events';
import { nextSide } from '../logic/nextSide';
import { sessionDuration } from '../logic/stats';
import { formatClock, formatDurationLong, formatElapsed, formatTimer } from '../logic/time';
import { t } from '../strings.de';
import { EditButton } from './EditButton';
import { Icon } from './icons';

const sideName = (side: Side | undefined) => (side === 'right' ? t.side.right : t.side.left);

/** "Nächste Seite L R"; while a feed runs it shows the side being fed instead ("Seite L R"). */
function NextSide({ side, current }: { side: Side; current: boolean }) {
  return (
    <div class="next-side">
      <span aria-hidden="true">{current ? t.today.currentSide : t.today.nextSide}</span>
      <span class="visually-hidden">{(current ? t.today.currentSideA11y : t.today.nextSideA11y)(sideName(side))}</span>
      <span class={`side-dot${side === 'left' ? ' is-next' : ''}`} aria-hidden="true">
        {t.side.leftShort}
      </span>
      <span class={`side-dot${side === 'right' ? ' is-next' : ''}`} aria-hidden="true">
        {t.side.rightShort}
      </span>
    </div>
  );
}

/** "Zuletzt gestillt": time since the end of the last feed, or the running feed. */
export function HeroCard({ data, now, onEdit }: { data: TodayData | undefined; now: number; onEdit?: (event: BabyEvent) => void }) {
  const running = data?.runningFeed;
  const session = data?.lastFeedSession;
  const next = nextSide(data?.lastFinishedFeed);

  let big: string;
  let line: string | undefined;
  if (running) {
    big = formatTimer(now - running.start);
    line = [sideName(running.side), t.time.since(formatClock(running.start))].join(' · ');
  } else if (session && session.end !== undefined) {
    big = formatElapsed(now - session.end);
    line = [sideName(session.lastSide), formatDurationLong(sessionDuration(session, now)), t.time.at(formatClock(session.end))].join(' · ');
  } else {
    big = t.today.nothingYet;
  }

  const content = (
    <>
      <div class="hero-head">
        <span class="icon-bubble">
          <Icon name="drop" size={18} />
        </span>
        <span>{running ? t.today.feedingNow : t.today.lastFed}</span>
        {running && <span class="live-dot" aria-hidden="true" />}
        {!running && data?.lastFinishedFeed && onEdit && (
          <EditButton label={t.today.editFeed} event={data.lastFinishedFeed} onEdit={onEdit} />
        )}
      </div>
      <p class={`hero-big${data && !running && !session ? ' is-empty' : ''}`}>{data ? big : ' '}</p>
      {line && <p class="hero-line">{line}</p>}
      <NextSide side={running ? (running.side ?? 'left') : next} current={Boolean(running)} />
    </>
  );

  // While a feed runs, the card leads back to the timer.
  return running ? (
    <a class="card hero is-link is-running" href="#/stillen">
      {content}
    </a>
  ) : (
    <section class="card hero" aria-label={t.today.lastFed}>
      {content}
    </section>
  );
}
