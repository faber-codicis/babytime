import { useEffect, useRef, useState } from 'preact/hooks';
import { cancelFeed, finishFeed, switchFeedSide, type Side } from '../data/events';
import { loadFeeding } from '../data/overview';
import { sessionDuration } from '../logic/stats';
import { formatClock, formatDuration, formatRelative, formatTimer } from '../logic/time';
import { navigate } from '../router';
import { t } from '../strings.de';
import { Icon } from '../ui/icons';
import { Sheet } from '../ui/Sheet';
import { TimerRing } from '../ui/TimerRing';
import { useLive, useNow } from '../ui/hooks';
import { useWakeLock } from '../ui/useWakeLock';

const SIDES: Side[] = ['left', 'right'];

/** Running feed (spec 6.3): side switch, timer ring, cancel with confirmation, done. */
export function Breastfeeding() {
  const data = useLive(loadFeeding, []);
  const now = useNow(1_000);
  const running = data?.running;
  const [confirmCancel, setConfirmCancel] = useState(false);
  const busy = useRef(false);

  useWakeLock(Boolean(running));

  // Nothing running (finished elsewhere, or opened directly): back to Today.
  useEffect(() => {
    if (data && !running) navigate('today', { replace: true });
  }, [data, running]);

  /** Runs one write at a time, so fast double taps cannot overlap. */
  const once = (action: () => Promise<unknown>) => async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await action();
    } finally {
      busy.current = false;
    }
  };

  const onDone = once(async () => {
    await finishFeed();
    navigate('today', { replace: true });
  });
  const onDiscard = once(async () => {
    setConfirmCancel(false);
    await cancelFeed();
    navigate('today', { replace: true });
  });

  if (!running) return <div class="feeding" />;

  const side = running.side ?? 'left';
  const elapsed = now - running.start;
  const previous = data?.previousSession;
  // Time per side in this feeding (after a switch both count), the running side until now.
  const perSide = { left: 0, right: 0 };
  for (const e of data?.currentSession?.events ?? [running]) perSide[e.side ?? 'left'] += Math.max(0, (e.end ?? now) - e.start);

  return (
    <div class="feeding">
      <header class="screen-head">
        <button type="button" class="round-btn" aria-label={t.feeding.back} onClick={() => navigate('today')}>
          <Icon name="back" size={22} />
        </button>
        <h1 class="screen-title">{t.feeding.title}</h1>
      </header>

      <div class="segmented" role="group" aria-label={t.feeding.sideA11y}>
        {SIDES.map((s) => (
          <button
            key={s}
            type="button"
            class={`segment${s === side ? ' is-active' : ''}`}
            aria-pressed={s === side}
            onClick={once(() => switchFeedSide(s))}
          >
            {s === 'left' ? t.feeding.left : t.feeding.right}
          </button>
        ))}
      </div>

      <TimerRing elapsedMs={elapsed}>
        <p class="timer-side">{side === 'left' ? t.feeding.leftSide : t.feeding.rightSide}</p>
        <p class="timer-time" aria-live="off">
          {formatTimer(elapsed)}
        </p>
        <p class="timer-started">{t.feeding.startedAt(formatClock(running.start))}</p>
      </TimerRing>

      <dl class="side-times" aria-label={t.feeding.sideTimesA11y}>
        {SIDES.map((s) => (
          <div key={s} class={`side-time${s === side ? ' is-active' : ''}`}>
            <dt>{s === 'left' ? t.feeding.left : t.feeding.right}</dt>
            <dd class="tabular">{formatTimer(perSide[s])}</dd>
          </div>
        ))}
      </dl>

      {previous && previous.end !== undefined && (
        <div class="last-time">
          <span class="side-dot side-dot--tint" aria-hidden="true">
            {previous.lastSide === 'right' ? t.side.rightShort : t.side.leftShort}
          </span>
          <p>
            {t.feeding.lastTime(
              previous.lastSide === 'right' ? t.side.right : t.side.left,
              formatDuration(sessionDuration(previous, now)),
              formatRelative(previous.end, now),
            )}
          </p>
        </div>
      )}

      <div class="bottom-actions">
        <button type="button" class="big-btn big-btn--white" onClick={() => setConfirmCancel(true)}>
          {t.feeding.cancel}
        </button>
        <button type="button" class="big-btn big-btn--rose big-btn--wide" onClick={() => void onDone()}>
          {t.feeding.done}
        </button>
      </div>

      <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} labelledBy="cancel-feed-title">
        <h2 id="cancel-feed-title" class="sheet-title">
          {t.feeding.cancelTitle}
        </h2>
        <p class="sheet-text">{t.feeding.cancelText}</p>
        <div class="sheet-actions">
          <button type="button" class="big-btn big-btn--rose" autoFocus onClick={() => setConfirmCancel(false)}>
            {t.feeding.cancelKeep}
          </button>
          <button type="button" class="big-btn big-btn--white big-btn--warn" onClick={() => void onDiscard()}>
            {t.feeding.cancelConfirm}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
