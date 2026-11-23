import { useRef, useState } from 'preact/hooks';
import { t } from '../strings';
import { Icon } from './icons';
import { photoFromFile } from './photoFile';

/**
 * Optional baby photo in "Profil bearbeiten" (0.18.0, mockups in design-0.18.0). The file input only opens the
 * phone's own picture picker; the app gets no camera access. The picture is made small right here and the
 * original is never kept.
 */
export function PhotoField(props: {
  photo: string | undefined;
  initial: string | undefined;
  onChange: (photo: string | undefined) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const has = props.photo !== undefined;

  const onFile = async (e: Event) => {
    const field = e.currentTarget as HTMLInputElement;
    const file = field.files?.[0];
    field.value = ''; // picking the same file again still fires `change`
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      props.onChange(await photoFromFile(file));
    } catch {
      setError(t.profile.photoError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="photo-field" role="group" aria-label={t.profile.photoA11y}>
      <div class="photo-wrap" aria-hidden="true">
        <div class="photo-big">
          {has ? (
            <img src={props.photo} alt="" width={112} height={112} />
          ) : props.initial ? (
            <span class="avatar-initial">{props.initial}</span>
          ) : (
            <Icon name="camera" size={40} />
          )}
        </div>
        <span class="photo-badge">
          <Icon name="camera" size={20} />
        </span>
      </div>
      <input
        ref={input}
        id="profile-photo"
        type="file"
        accept="image/*"
        class="visually-hidden"
        tabIndex={-1}
        onChange={(e) => void onFile(e)}
      />
      <div class="photo-actions">
        <button type="button" class="photo-btn" disabled={busy} onClick={() => input.current?.click()}>
          <Icon name="camera" size={20} />
          {busy ? t.profile.photoBusy : has ? t.profile.photoChange : t.profile.photoPick}
        </button>
        {has && !busy && (
          <button type="button" class="photo-btn photo-btn--plain" onClick={() => props.onChange(undefined)}>
            <Icon name="trash" size={20} />
            {t.profile.photoRemove}
          </button>
        )}
      </div>
      {error ? (
        <p class="field-error" role="alert">
          {error}
        </p>
      ) : (
        <p class="photo-note">
          <Icon name="shield" size={18} />
          <span>{has ? t.profile.photoNoteSet : t.profile.photoNoteEmpty}</span>
        </p>
      )}
    </div>
  );
}
