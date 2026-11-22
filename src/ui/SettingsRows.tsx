import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from './icons';

/** A tappable settings row with icon, label and optional hint (at least 64 px high). */
export function ActionRow(props: {
  /** Target for a guide's button (0.16.0). */
  id?: string;
  icon: IconName;
  label: string;
  hint?: string | undefined;
  warn?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={props.id}
      class={`data-action${props.warn ? ' data-action--warn' : ''}`}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <span class="data-action-icon" aria-hidden="true">
        <Icon name={props.icon} size={20} />
      </span>
      <span class="data-action-text">
        <span class="data-action-label">{props.label}</span>
        {props.hint && <span class="data-action-hint">{props.hint}</span>}
      </span>
    </button>
  );
}

/** Same look as ActionRow, but a link (e.g. mailto for "Feedback senden", 0.13.0). */
export function LinkRow(props: { id?: string; icon: IconName; label: string; hint?: string | undefined; href: string }) {
  return (
    <a class="data-action data-action--link" id={props.id} href={props.href}>
      <span class="data-action-icon" aria-hidden="true">
        <Icon name={props.icon} size={20} />
      </span>
      <span class="data-action-text">
        <span class="data-action-label">{props.label}</span>
        {props.hint && <span class="data-action-hint">{props.hint}</span>}
      </span>
    </a>
  );
}

/** On/off row (mockup "Einstellungen"): the whole row is the switch, at least 64 px high. */
export function SwitchRow(props: { icon: IconName; label: string; hint: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={props.checked} class="data-action" onClick={() => props.onChange(!props.checked)}>
      <span class="data-action-icon" aria-hidden="true">
        <Icon name={props.icon} size={20} />
      </span>
      <span class="data-action-text">
        <span class="data-action-label">{props.label}</span>
        <span class="data-action-hint">{props.hint}</span>
      </span>
      <span class={`switch${props.checked ? ' is-on' : ''}`} aria-hidden="true">
        <span class="switch-knob" />
      </span>
    </button>
  );
}

/** A titled group of rows, e.g. "Daten". */
export function SettingsSection(props: { id: string; title: string; children: ComponentChildren }) {
  return (
    <section class="settings-section" aria-labelledby={props.id}>
      <h2 id={props.id} class="settings-section-title">
        {props.title}
      </h2>
      {props.children}
    </section>
  );
}

/**
 * Accent colour row (mockup "Einstellungen"): five round swatches as a radio group. The colour is never the only
 * cue: each swatch has its name as label, the chosen one a ring and a tick, and the hint names it.
 */
export function AccentRow<K extends string>(props: {
  label: string;
  hint: string;
  options: readonly K[];
  names: Record<K, string>;
  value: K;
  onChange: (value: K) => void;
}) {
  const move = (event: KeyboardEvent, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = props.options[(index + step + props.options.length) % props.options.length]!;
    props.onChange(next);
    const group = (event.currentTarget as HTMLElement).parentElement;
    group?.querySelector<HTMLElement>(`[data-color="${next}"]`)?.focus();
  };
  return (
    <div class="data-action accent-row">
      <div class="accent-row-head">
        <span class="data-action-icon" aria-hidden="true">
          <Icon name="palette" size={20} />
        </span>
        <span class="data-action-text">
          <span class="data-action-label" id="accent-label">
            {props.label}
          </span>
          <span class="data-action-hint">
            {props.names[props.value]} · {props.hint}
          </span>
        </span>
      </div>
      <div class="accent-swatches" role="radiogroup" aria-labelledby="accent-label">
        {props.options.map((key, index) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={key === props.value}
            aria-label={props.names[key]}
            tabIndex={key === props.value ? 0 : -1}
            data-color={key}
            class={`accent-swatch${key === props.value ? ' is-on' : ''}`}
            onClick={() => props.onChange(key)}
            onKeyDown={(event) => move(event, index)}
          >
            {key === props.value && <Icon name="check" size={20} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A row that opens a settings sub page (0.17.0): icon, label, current state as hint, chevron. */
export function NavRow(props: { icon: IconName; label: string; hint?: ComponentChildren; href: string }) {
  return (
    <a class="data-action data-action--link" href={props.href}>
      <span class="data-action-icon" aria-hidden="true">
        <Icon name={props.icon} size={20} />
      </span>
      <span class="data-action-text">
        <span class="data-action-label">{props.label}</span>
        {props.hint && <span class="data-action-hint">{props.hint}</span>}
      </span>
      <span class="row-chevron" aria-hidden="true">
        <Icon name="forward" size={20} />
      </span>
    </a>
  );
}

/**
 * A choice in one line (0.17.0, e.g. the language): label left, a native picker right. The picker is the phone's own,
 * so it stays readable with large text and needs no room for every option.
 */
export function SelectRow<K extends string>(props: {
  id?: string;
  icon: IconName;
  label: string;
  options: readonly (readonly [K, string])[];
  value: K;
  onChange: (value: K) => void;
}) {
  const selectId = `${props.id ?? 'select'}-input`;
  return (
    <div class="data-action select-row" id={props.id} tabIndex={props.id ? -1 : undefined}>
      <span class="data-action-icon" aria-hidden="true">
        <Icon name={props.icon} size={20} />
      </span>
      <label class="data-action-label select-row-label" for={selectId}>
        {props.label}
      </label>
      <span class="select-pill">
        <select
          id={selectId}
          value={props.value}
          onChange={(event) => {
            const value = (event.currentTarget as HTMLSelectElement).value as K;
            if (value !== props.value) props.onChange(value);
          }}
        >
          {props.options.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        <Icon name="down" size={18} />
      </span>
    </div>
  );
}
