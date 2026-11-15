import { useLayoutEffect, useState } from 'preact/hooks';
import { saveProfile, type Profile } from '../data/profile';
import { t } from '../strings';
import { birthDateError, ProfileFields, type ProfileForm } from './ProfileFields';
import { Sheet } from './Sheet';

/** "Profil bearbeiten" (spec 6.7): name and birth date stay optional and can be cleared. */
export function ProfileSheet(props: { open: boolean; profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProfileForm>({ babyName: '', birthDate: '' });
  const [error, setError] = useState<string>();

  // Filled in the same frame the sheet opens.
  useLayoutEffect(() => {
    if (!props.open) return;
    setForm({ babyName: props.profile.babyName ?? '', birthDate: props.profile.birthDate ?? '' });
    setError(undefined);
  }, [props.open]);

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const found = birthDateError(form.birthDate);
    setError(found);
    if (found) return;
    await saveProfile({ babyName: form.babyName, birthDate: form.birthDate, onboarded: true });
    props.onSaved();
  };

  return (
    <Sheet open={props.open} onClose={props.onClose} labelledBy="profile-sheet-title">
      <form class="editor" noValidate onSubmit={(e) => void onSubmit(e)}>
        <h2 id="profile-sheet-title" class="sheet-title">
          {t.profile.editTitle}
        </h2>
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
