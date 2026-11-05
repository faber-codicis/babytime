/** Line icons from spec section 9 (24 × 24, stroke 2.2, round caps). Always decorative. */
const PATHS = {
  drop: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',
  diaper: 'M4 7h16l-2 9a4 4 0 0 1-4 3h-4a4 4 0 0 1-4-3z',
  dirty: 'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10',
  both: 'M7.5 5c2 2.6 4 4.6 4 7.2a4 4 0 0 1-8 0c0-2.6 2-4.6 4-7.2zM17 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7',
  // Bottle (teat, cap ring, body with a fill line) and pump (breast shield funnel), since 0.6.0.
  bottle: 'M10 3h4M10.5 3v2.5L9 7h6l-1.5-1.5V3M8 7h8v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM8 12h8',
  pump: 'M4 4h16l-5.5 7v7a2.5 2.5 0 0 1-5 0v-7z',
  minus: 'M5 12h14',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  back: 'M15 18l-6-6 6-6',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  history: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  info: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 11v5M12 7.5v.01',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 15V4M7 9l5-5 5 5M5 20h14',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  // Spec 6.1: "Einstellungen" tab (sliders).
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M13 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9c-4-1.5-7-4.5-7-9V6z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, class: className }: { name: IconName; size?: number; class?: string }) {
  return (
    <svg
      class={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Logo face without the outer square, on a #F7DCE2 disc (spec section 9, avatar variant). */
export function BabyFace({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="98" fill="#F7DCE2" />
      <circle cx="44" cy="104" r="9" fill="#F5C4AE" />
      <circle cx="156" cy="104" r="9" fill="#F5C4AE" />
      <circle cx="100" cy="100" r="58" fill="#FBD9C7" />
      <path d="M100 42 Q92 30 102 26 Q112 24 108 34" fill="none" stroke="#3A2630" stroke-width="4" stroke-linecap="round" />
      <circle cx="68" cy="112" r="9" fill="#F4A6A0" opacity="0.7" />
      <circle cx="132" cy="112" r="9" fill="#F4A6A0" opacity="0.7" />
      <path d="M68 92 Q76 82 84 92" fill="none" stroke="#3A2630" stroke-width="4.5" stroke-linecap="round" />
      <path d="M116 92 Q124 82 132 92" fill="none" stroke="#3A2630" stroke-width="4.5" stroke-linecap="round" />
      <path d="M80 112 Q100 140 120 112 Z" fill="#8E2F47" stroke="#8E2F47" stroke-width="3" stroke-linejoin="round" />
      <path d="M90 123 Q100 117 110 123 Q100 131 90 123 Z" fill="#F08A9B" />
    </svg>
  );
}

/**
 * The logo baby, laughing (for "Was ist neu" and the update popup): eyes squeezed shut, mouth wide
 * open, rosier cheeks, little hands up, and "joy" strokes around the head. Same colours as the logo.
 */
export function LaughingBaby({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" focusable="false" class="laughing-baby">
      {/* joy strokes */}
      <g stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity="0.9">
        <path d="M30 46 L42 58" />
        <path d="M20 78 L36 82" />
        <path d="M170 46 L158 58" />
        <path d="M180 78 L164 82" />
      </g>
      <circle cx="100" cy="104" r="70" fill="#F7DCE2" />
      {/* ears */}
      <circle cx="44" cy="108" r="10" fill="#F5C4AE" />
      <circle cx="156" cy="108" r="10" fill="#F5C4AE" />
      <circle cx="100" cy="104" r="58" fill="#FBD9C7" />
      {/* curl */}
      <path d="M100 46 Q92 34 102 30 Q112 28 108 38" fill="none" stroke="#3A2630" stroke-width="4" stroke-linecap="round" />
      {/* cheeks */}
      <circle cx="64" cy="118" r="11" fill="#F4A6A0" opacity="0.85" />
      <circle cx="136" cy="118" r="11" fill="#F4A6A0" opacity="0.85" />
      {/* squeezed laughing eyes > < */}
      <path d="M66 88 L80 95 L66 102" fill="none" stroke="#3A2630" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M134 88 L120 95 L134 102" fill="none" stroke="#3A2630" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      {/* wide open laughing mouth with tongue */}
      <path d="M74 112 Q100 112 126 112 Q124 150 100 150 Q76 150 74 112 Z" fill="#8E2F47" stroke="#8E2F47" stroke-width="3" stroke-linejoin="round" />
      <path d="M84 138 Q100 126 116 138 Q108 148 100 148 Q92 148 84 138 Z" fill="#F08A9B" />
      {/* little hands up */}
      <circle cx="34" cy="146" r="13" fill="#FBD9C7" stroke="#F5C4AE" stroke-width="3" />
      <circle cx="166" cy="146" r="13" fill="#FBD9C7" stroke="#F5C4AE" stroke-width="3" />
    </svg>
  );
}
