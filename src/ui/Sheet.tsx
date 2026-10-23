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
