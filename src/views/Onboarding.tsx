import { useState } from 'preact/hooks';
import { completeOnboarding } from '../data/profile';
import { t } from '../strings.de';
import { Icon } from '../ui/icons';
import { InstallHint } from '../ui/InstallHint';
import { birthDateError, ProfileFields, type ProfileForm } from '../ui/ProfileFields';

/** First start (spec 6.7, mockups "Willkommen" + "Einrichtung"): one screen, everything optional. */
export function Onboarding() {
  const [form, setForm] = useState<ProfileForm>({ babyName: '', birthDate: '' });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const finish = async (withData: boolean) => {
    if (busy) return;
    if (withData) {
      const found = birthDateError(form.birthDate);
      setError(found);
      if (found) return;
    }
    setBusy(true);
    try {
      // The app switches to Today as soon as the profile says onboarded (live query).
      await completeOnboarding(withData ? { babyName: form.babyName, birthDate: form.birthDate } : {}, __APP_VERSION__);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="onboarding">
      <span class="onboarding-blob onboarding-blob--a" aria-hidden="true" />
      <span class="onboarding-blob onboarding-blob--b" aria-hidden="true" />
      <InstallHint />
      <span class="onboarding-heart" aria-hidden="true">
        <Icon name="heart" size={30} />
      </span>
      <h1 class="onboarding-title">{t.onboarding.title}</h1>
      <p class="onboarding-text">
        {t.onboarding.text} {t.onboarding.privacy}
      </p>

      <form
        class="onboarding-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void finish(true);
        }}
      >
        <ProfileFields form={form} onChange={setForm} error={error} />
        <div class="onboarding-actions">
          <button type="submit" class="big-btn big-btn--rose" disabled={busy}>
            {t.onboarding.start}
          </button>
          <button type="button" class="text-btn" disabled={busy} onClick={() => void finish(false)}>
            {t.onboarding.skip}
          </button>
        </div>
      </form>
    </div>
  );
}
