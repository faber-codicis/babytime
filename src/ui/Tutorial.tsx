import { useEffect, useState } from 'preact/hooks';
import { t } from '../strings';
import { BabyFace, Icon, type IconName } from './icons';
import { Sheet } from './Sheet';

/** Small floating decorations around each picture: icon, position (% of the picture) and size. */
type Deco = { icon: IconName; x: number; y: number; size: number; tone: string };

interface Art {
  /** Big round bubble in the middle: the baby face, or an icon on a tracker colour. */
  main: { face: true } | { icon: IconName; tone: string };
  /** Little badges around the bubble (L/R, "Rückgängig", the three trackers). */
  badges?: { text?: string; icon?: IconName; tone: string; x: number; y: number }[];
  deco: Deco[];
}

/** One picture per step, built from the app's own colours, so it follows light/dark and the accent colour. */
const ART: Art[] = [
  {
    main: { face: true },
    badges: [
      { icon: 'drop', tone: 'rose', x: 78, y: 70 },
      { text: 'L', tone: 'rose-solid', x: 20, y: 48 },
      { text: 'R', tone: 'ring', x: 30, y: 26 },
    ],
    deco: [
      { icon: 'heart', x: 84, y: 14, size: 18, tone: 'rose' },
      { icon: 'heart', x: 8, y: 74, size: 14, tone: 'rose' },
    ],
  },
  {
    main: { icon: 'diaper', tone: 'peach' },
    badges: [
      { icon: 'bottle', tone: 'sky', x: 14, y: 62 },
      { icon: 'moon', tone: 'lavender', x: 82, y: 62 },
    ],
    deco: [
      { icon: 'star', x: 80, y: 12, size: 16, tone: 'lavender' },
      { icon: 'heart', x: 14, y: 12, size: 14, tone: 'peach' },
    ],
  },
  {
    main: { icon: 'pencil', tone: 'rose' },
    badges: [{ text: t.snackbar.undo, tone: 'snack', x: 50, y: 82 }],
    deco: [
      { icon: 'check', x: 84, y: 18, size: 20, tone: 'rose' },
      { icon: 'heart', x: 12, y: 22, size: 14, tone: 'rose' },
    ],
  },
  {
    main: { face: true },
    badges: [{ icon: 'moon', tone: 'lavender', x: 80, y: 20 }],
    deco: [
      { icon: 'star', x: 12, y: 16, size: 16, tone: 'lavender' },
      { icon: 'star', x: 20, y: 70, size: 12, tone: 'lavender' },
      { icon: 'star', x: 90, y: 74, size: 14, tone: 'lavender' },
    ],
  },
  {
    main: { icon: 'shield', tone: 'sky' },
    badges: [{ icon: 'phone', tone: 'rose', x: 80, y: 68 }],
    deco: [
      { icon: 'heart', x: 14, y: 18, size: 16, tone: 'rose' },
      { icon: 'heart', x: 86, y: 12, size: 12, tone: 'rose' },
    ],
  },
];

function Picture({ art }: { art: Art }) {
  return (
    <div class="tut-art" aria-hidden="true">
      <span class="tut-blob" />
      {art.deco.map((d, i) => (
        <span key={i} class={`tut-deco tone-${d.tone}`} style={{ left: `${d.x}%`, top: `${d.y}%`, animationDelay: `${i * 0.6}s` }}>
          <Icon name={d.icon} size={d.size} />
        </span>
      ))}
      <span class={`tut-main${'face' in art.main ? ' tut-main--face' : ` tone-${art.main.tone}`}`}>
        {'face' in art.main ? <BabyFace size={112} /> : <Icon name={art.main.icon} size={52} />}
      </span>
      {art.badges?.map((b, i) => (
        <span key={i} class={`tut-badge tone-${b.tone}${b.text && b.text.length > 1 ? ' tut-badge--pill' : ''}`} style={{ left: `${b.x}%`, top: `${b.y}%` }}>
          {b.icon ? <Icon name={b.icon} size={20} /> : b.text}
        </span>
      ))}
    </div>
  );
}

/**
 * Short introduction (0.16.0): five cards after the first start, skippable, and again from Einstellungen →
 * "So funktioniert Baby Time". Tired parents read little, so each card is one picture, a title and two lines.
 */
export function Tutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = t.tutorial.steps;
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const last = step === steps.length - 1;
  const current = steps[step]!;

  return (
    <Sheet open={open} onClose={onClose} labelledBy="tutorial-title">
      <div class="tutorial">
        {/* Own row, so it never covers the picture; stays as an empty row on the last card (no jump). */}
        <div class="tut-top">
          {!last && (
            <button type="button" class="text-btn tut-skip" onClick={onClose}>
              {t.tutorial.skip}
            </button>
          )}
        </div>
        <Picture art={ART[step]!} />
        <p class="visually-hidden" id="tutorial-title">
          {t.tutorial.title}
        </p>
        <div class="tut-text" aria-live="polite">
          <p class="tut-step">{t.tutorial.stepOf(step + 1, steps.length)}</p>
          <h2 class="tut-title">{current.title}</h2>
          <p class="tut-body">{current.text}</p>
        </div>
        <div class="tut-dots" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} class={`tut-dot${i === step ? ' is-active' : ''}`} />
          ))}
        </div>
        <div class="tut-actions">
          {step > 0 && (
            <button type="button" class="big-btn big-btn--white tut-back" onClick={() => setStep(step - 1)} aria-label={t.tutorial.back}>
              <Icon name="back" size={22} />
            </button>
          )}
          <button type="button" class="big-btn big-btn--rose" data-autofocus onClick={() => (last ? onClose() : setStep(step + 1))}>
            {last ? t.tutorial.done : t.tutorial.next}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
