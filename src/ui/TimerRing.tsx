import type { ComponentChildren } from 'preact';
import { MINUTE } from '../logic/time';

const SIZE = 280;
const STROKE = 12;
const R = SIZE / 2 - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
/** One full lap of the ring, then it starts over (spec 6.3). */
export const LAP_MS = 15 * MINUTE;

export function TimerRing({ elapsedMs, children }: { elapsedMs: number; children: ComponentChildren }) {
  const progress = (Math.max(0, elapsedMs) % LAP_MS) / LAP_MS;
  return (
    <div class="timer-ring">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
        <circle class="timer-track" cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke-width={STROKE} />
        <circle class="timer-disc" cx={SIZE / 2} cy={SIZE / 2} r={R - STROKE / 2} />
        <circle
          class="timer-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke-width={STROKE}
          stroke-linecap="round"
          stroke-dasharray={CIRCUMFERENCE}
          stroke-dashoffset={CIRCUMFERENCE * (1 - progress)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div class="timer-center">{children}</div>
    </div>
  );
}
