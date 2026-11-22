import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the sheet (aria-labelledby). */
  labelledBy: string;
  children: ComponentChildren;
}

/**
 * Touch browsers (iOS Safari among them) do not focus a tapped button, so the element that
 * opened a sheet is remembered from the last pointer press as a fallback return target.
 */
let lastPressed: HTMLElement | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      lastPressed = e.target instanceof Element ? e.target.closest<HTMLElement>('button, a, input') : null;
    },
    { capture: true, passive: true },
  );
}

function openerElement(): HTMLElement | null {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) return active;
  return lastPressed?.isConnected ? lastPressed : null;
}

/** How long after opening a scroll the user did not cause is undone. */
const HOLD_TOP_MS = 1500;

/**
 * WebKit sometimes scrolls a freshly opened dialog to its focused button a frame or two later,
 * despite preventScroll (seen in CI, 2026-11-22; again with the taller 0.17.0 popup, scrollTop 410 on
 * the first check after opening). Until the user touches, scrolls, types or moves focus (also a screen
 * reader), any scroll in the first moments is put back to the top: on each scroll event and, because
 * scroll events only arrive with the next frame, also checked every frame.
 */
function holdAtTop(dialog: HTMLDialogElement): void {
  const until = performance.now() + HOLD_TOP_MS;
  let frame = 0;
  const reset = () => {
    if (dialog.scrollTop !== 0) dialog.scrollTop = 0;
  };
  const onScroll = () => {
    if (performance.now() > until) return stop();
    reset();
  };
  const tick = () => {
    if (performance.now() > until || !dialog.open) return stop();
    reset();
    frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    dialog.removeEventListener('scroll', onScroll);
    for (const type of USER_INPUT) dialog.removeEventListener(type, stop, true);
  };
  dialog.addEventListener('scroll', onScroll);
  for (const type of USER_INPUT) dialog.addEventListener(type, stop, { capture: true, once: true });
  frame = requestAnimationFrame(tick);
  setTimeout(stop, HOLD_TOP_MS);
}

const USER_INPUT = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'focusin'] as const;

/**
 * Bottom sheet on a native modal <dialog>: focus moves in and back out, Escape and a tap
 * outside close it, the page behind is inert.
 */
export function Sheet({ open, onClose, labelledBy, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Layout effect: the sheet opens in the same frame as the tap, not one frame later.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = openerElement();
      dialog.showModal();
      // A tall sheet (e.g. the update popup with a guide, 0.14.0) starts at its title, even when its default
      // button ([data-autofocus]) sits further down: focus it without scrolling, then back to the top.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
      dialog.scrollTop = 0;
      requestAnimationFrame(() => (dialog.scrollTop = 0));
      holdAtTop(dialog);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Unmounting while open (e.g. route change) must not leave focus nowhere.
  useEffect(() => () => returnFocus.current?.focus(), []);

  return (
    <dialog
      ref={ref}
      class="sheet"
      aria-labelledby={labelledBy}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault(); // Escape: let the owner decide, so state and dialog stay in sync
        onClose();
      }}
      onClose={() => {
        returnFocus.current?.focus();
        returnFocus.current = null;
      }}
      onClick={(e) => {
        // The dialog itself is only hit on the backdrop; content sits in .sheet-body.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div class="sheet-body">
        <span class="sheet-handle" aria-hidden="true" />
        {children}
      </div>
    </dialog>
  );
}
