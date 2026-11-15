import { useEffect } from 'preact/hooks';
import { t } from '../strings';

export interface SnackMessage {
  id: number;
  text: string;
  undo?: () => Promise<void>;
}

export const SNACK_DURATION_MS = 6_000;

/** Short confirmation with an undo button; disappears after 6 seconds (spec 6.4). */
export function Snackbar({ message, onDone }: { message: SnackMessage | undefined; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, SNACK_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [message?.id]);

  return (
    <div class="snackbar-region" role="status" aria-live="polite">
      {message && (
        <div class="snackbar" key={message.id}>
          <span class="snackbar-text">{message.text}</span>
          {message.undo && (
            <button
              type="button"
              class="snackbar-undo"
              onClick={() => {
                onDone();
                void message.undo?.();
              }}
            >
              {t.snackbar.undo}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
