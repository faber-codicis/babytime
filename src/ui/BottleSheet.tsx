import { useEffect, useState } from 'preact/hooks';
import type { BabyEvent, MilkKind, PumpSide } from '../data/events';
import { AMOUNT_MAX, AMOUNT_MIN } from '../logic/validate';
import { t } from '../strings.de';
import { Icon } from './icons';
import { Sheet } from './Sheet';

export type BottleMode = 'bottle' | 'pump';

export type BottlePick =
  | { mode: 'bottle'; amountMl: number; milk: MilkKind; minutesAgo: number }
  | { mode: 'pump'; amountMl: number; pumpSide: PumpSide; minutesAgo: number };

/** Plus and minus change the amount in these steps; most bottles are measured in 10 ml marks. */
const STEP = 10;
const DEFAULT_ML = 60;
/** Same choice as the diaper sheet: "jetzt" or a few minutes back. */
const WHEN = [0, 5, 15, 30];

interface Props {
  /** Bottle and/or pump, as switched on in Einstellungen; with only one, there is no mode switch. */
  modes?: { bottle: boolean; pump: boolean };
  open: boolean;
  /** The newest bottle and pump entry: the sheet starts with their amount and choice. */
  latest: { bottle: BabyEvent | undefined; pump: BabyEvent | undefined } | undefined;
  onClose: () => void;
  onSave: (pick: BottlePick) => void;
}

function Toggle<T extends string>(props: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const id = `bottle-${props.label}`;
  return (
    <div class="field bottle-field">
      <span class="field-label" id={id}>
        {props.label}
      </span>
      <div class="segmented segmented--small segmented--sky" role="group" aria-labelledby={id}>
        {props.options.map(([value, text]) => (
          <button
            key={value}
            type="button"
            class={`segment${value === props.value ? ' is-active' : ''}`}
            aria-pressed={value === props.value}
            onClick={() => props.onChange(value)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

const clamp = (ml: number) => Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, ml));

/**
 * Bottle or pumping in one sheet (spec 6.11): amount with − / +, milk or side, optional "vor x Min".
 * Everything starts with the last entry, so the usual case is 2 taps: Flasche, Speichern.
 */
export function BottleSheet({ open, latest, modes = { bottle: true, pump: true }, onClose, onSave }: Props) {
  const [mode, setMode] = useState<BottleMode>('bottle');
  const [bottleMl, setBottleMl] = useState(DEFAULT_ML);
  const [pumpMl, setPumpMl] = useState(DEFAULT_ML);
  const [milk, setMilk] = useState<MilkKind>('breast');
  const [pumpSide, setPumpSide] = useState<PumpSide>('both');
  const [minutesAgo, setMinutesAgo] = useState(0);

  // Every opening starts at "jetzt" with the last amounts; the mode is whatever was entered last.
  useEffect(() => {
    if (!open) return;
    const { bottle, pump } = latest ?? { bottle: undefined, pump: undefined };
    const lastWasPump = Boolean(pump && (!bottle || pump.start > bottle.start));
    setMode(!modes.bottle ? 'pump' : !modes.pump ? 'bottle' : lastWasPump ? 'pump' : 'bottle');
    setBottleMl(bottle?.amountMl ?? DEFAULT_ML);
    setPumpMl(pump?.amountMl ?? DEFAULT_ML);
    setMilk(bottle?.milk ?? 'breast');
    setPumpSide(pump?.pumpSide ?? 'both');
    setMinutesAgo(0);
  }, [open]);

  const s = t.bottleSheet;
  const amount = mode === 'bottle' ? bottleMl : pumpMl;
  const setAmount = (ml: number) => (mode === 'bottle' ? setBottleMl(clamp(ml)) : setPumpMl(clamp(ml)));
  // From 1 ml, the first "+" goes to 10, not 11: keeps amounts on the bottle marks.
  const step = (dir: 1 | -1) => setAmount(dir === 1 ? Math.floor(amount / STEP) * STEP + STEP : Math.ceil(amount / STEP) * STEP - STEP);

  const save = () =>
    onSave(mode === 'bottle' ? { mode, amountMl: bottleMl, milk, minutesAgo } : { mode, amountMl: pumpMl, pumpSide, minutesAgo });

  return (
    <Sheet open={open} onClose={onClose} labelledBy="bottle-sheet-title">
      <div class="sheet-head">
        <span class="icon-bubble icon-bubble--sky">
          <Icon name={mode === 'bottle' ? 'bottle' : 'pump'} size={18} />
        </span>
        <h2 id="bottle-sheet-title" class="sheet-title">
          {mode === 'bottle' ? s.title : s.titlePump}
        </h2>
      </div>

      {modes.bottle && modes.pump && (
        <div class="segmented segmented--small segmented--sky bottle-mode" role="group" aria-label={s.modeA11y}>
          {(['bottle', 'pump'] as const).map((m) => (
            <button
              key={m}
              type="button"
              class={`segment${m === mode ? ' is-active' : ''}`}
              aria-pressed={m === mode}
              onClick={() => setMode(m)}
            >
              {s[m]}
            </button>
          ))}
        </div>
      )}

      <div class="amount" role="group" aria-label={s.amountA11y}>
        <button type="button" class="amount-btn" aria-label={s.less(STEP)} disabled={amount <= AMOUNT_MIN} onClick={() => step(-1)}>
          <Icon name="minus" size={24} />
        </button>
        <output class="amount-value tabular" aria-live="polite">
          {t.ml(amount)}
        </output>
        <button type="button" class="amount-btn" aria-label={s.more(STEP)} disabled={amount >= AMOUNT_MAX} onClick={() => step(1)}>
          <Icon name="plus" size={24} />
        </button>
      </div>

      {mode === 'bottle' ? (
        <Toggle
          label={s.milk}
          value={milk}
          options={[
            ['breast', s.breast],
            ['formula', s.formula],
          ]}
          onChange={setMilk}
        />
      ) : (
        <Toggle
          label={s.side}
          value={pumpSide}
          options={[
            ['left', s.left],
            ['right', s.right],
            ['both', s.both],
          ]}
          onChange={setPumpSide}
        />
      )}

      <div class="when-pills when-pills--sky" role="group" aria-label={t.diaperSheet.whenA11y}>
        {WHEN.map((m) => (
          <button
            key={m}
            type="button"
            class={`when-pill${m === minutesAgo ? ' is-active' : ''}`}
            aria-pressed={m === minutesAgo}
            aria-label={m ? t.diaperSheet.minutesAgoA11y(m) : undefined}
            onClick={() => setMinutesAgo(m)}
          >
            {m ? t.diaperSheet.minutesAgo(m) : t.diaperSheet.now}
          </button>
        ))}
      </div>

      <div class="sheet-actions">
        <button type="button" class="big-btn big-btn--sky" onClick={save}>
          {s.save}
        </button>
      </div>
    </Sheet>
  );
}
