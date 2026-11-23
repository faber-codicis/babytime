import { useLayoutEffect, useState } from 'preact/hooks';
import { saveProfile, type Profile } from '../data/profile';
import { t } from '../strings';
import { PhotoField } from './PhotoField';
import { birthDateError, ProfileFields, type ProfileForm } from './ProfileFields';
import { Sheet } from './Sheet';

/** "Profil bearbeiten" (spec 6.7): name, birth date and photo (0.18.0) stay optional and can be cleared. */
export function ProfileSheet(props: { open: boolean; profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProfileForm>({ babyName: '', birthDate: '' });
  const [error, setError] = useState<string>();
  const [photo, setPhoto] = useState<string>();

  // Filled in the same frame the sheet opens.
  useLayoutEffect(() => {
    if (!props.open) return;
    setForm({ babyName: props.profile.babyName ?? '', birthDate: props.profile.birthDate ?? '' });
    setPhoto(props.profile.photo);
    setError(undefined);
  }, [props.open]);

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const found = birthDateError(form.birthDate);
    setError(found);
    if (found) return;
    // The photo is saved with the rest; "Entfernen" only takes effect with "Speichern".
    await saveProfile({ babyName: form.babyName, birthDate: form.birthDate, ...(photo ? { photo } : {}), onboarded: true });
    props.onSaved();
  };

  return (
    <Sheet open={props.open} onClose={props.onClose} labelledBy="profile-sheet-title">
      <form class="editor" noValidate onSubmit={(e) => void onSubmit(e)}>
        <h2 id="profile-sheet-title" class="sheet-title">
          {t.profile.editTitle}
        </h2>
        <PhotoField photo={photo} initial={form.babyName.trim().charAt(0).toUpperCase() || undefined} onChange={setPhoto} />
        <ProfileFields form={form} onChange={setForm} error={error} />
        <div class="sheet-actions">
          <button type="submit" class="big-btn big-btn--rose">
            {t.profile.save}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
