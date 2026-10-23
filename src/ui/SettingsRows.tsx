import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from './icons';

/** A tappable settings row with icon, label and optional hint (at least 64 px high). */
export function ActionRow(props: { icon: IconName; label: string; hint?: string | undefined; warn?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" class={`data-action${props.warn ? ' data-action--warn' : ''}`} disabled={props.disabled} onClick={props.onClick}>
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
