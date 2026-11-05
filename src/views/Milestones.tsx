import { useState } from 'preact/hooks';
import { getMilestones, MILESTONE_PRESETS, type Milestone } from '../data/milestones';
import type { Profile } from '../data/profile';
import { formatAgeOn, formatIsoDate } from '../logic/time';
import { t } from '../strings.de';
import { useLive } from '../ui/hooks';
import { Icon } from '../ui/icons';
import { MilestoneSheet, milestoneTitle, type MilestoneTarget } from '../ui/MilestoneSheet';
import { Snackbar, type SnackMessage } from '../ui/Snackbar';

let snackId = 0;

/** "12. November 2026 · mit 7 Wochen" (age only with a birth date). */
function when(milestone: Milestone, profile: Profile): string {
  const age = profile.birthDate ? formatAgeOn(profile.birthDate, milestone.date) : undefined;
  return [formatIsoDate(milestone.date), age].filter(Boolean).join(' · ');
}

/** Fourth tab (0.10.0, mockup "Navigation"): reached milestones, newest first, then the open suggestions. */
export function Milestones({ profile }: { profile: Profile }) {
  const milestones = useLive(getMilestones, []);
  const [target, setTarget] = useState<MilestoneTarget>();
  const [snack, setSnack] = useState<SnackMessage>();
  const m = t.milestones;

  const reachedPresets = new Set((milestones ?? []).map((x) => x.preset).filter(Boolean));
  const open = MILESTONE_PRESETS.filter((p) => !reachedPresets.has(p));

  return (
    <div class="milestones">
      <header class="history-head">
        <h1 class="screen-title">{m.title}</h1>
        <button type="button" class="round-btn round-btn--rose" aria-label={m.add} onClick={() => setTarget({ custom: true })}>
          <Icon name="plus" size={22} />
        </button>
      </header>
      <p class="milestones-intro">{m.intro}</p>

      {milestones && milestones.length > 0 && (
        <section class="day" aria-labelledby="milestones-reached">
          <h2 id="milestones-reached" class="day-title">
            {m.reached}
          </h2>
          <ul class="event-list">
            {milestones.map((milestone) => (
              <li key={milestone.id}>
                <button type="button" class="event-row" onClick={() => setTarget({ milestone })}>
                  <span class="event-icon event-icon--rose" aria-hidden="true">
                    <Icon name="star" size={20} />
                  </span>
                  <span class="event-text">
                    <span class="event-title">{milestoneTitle(milestone)}</span>
                    <span class="event-sub">{when(milestone, profile)}</span>
                    {milestone.note && <span class="event-note">{milestone.note}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {open.length > 0 && (
        <section class="day" aria-labelledby="milestones-open">
          <h2 id="milestones-open" class="day-title">
            {m.open}
          </h2>
          <p class="day-summary">{m.openHint}</p>
          <ul class="milestone-chips">
            {open.map((preset) => (
              <li key={preset}>
                <button type="button" class="milestone-chip" onClick={() => setTarget({ preset })}>
                  <Icon name="plus" size={16} />
                  {m.presets[preset]}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div class="snack-anchor">
        <Snackbar message={snack} onDone={() => setSnack(undefined)} />
      </div>

      <MilestoneSheet
        target={target}
        onClose={() => setTarget(undefined)}
        onDone={(text, undo) => {
          setTarget(undefined);
          setSnack({ id: ++snackId, text, undo });
        }}
      />
    </div>
  );
}
