import { BABY_NAME_MAX } from '../data/profile';
import { birthDateProblem, earliestBirthDate, isoDate } from '../logic/time';
import { t } from '../strings';

export interface ProfileForm {
  babyName: string;
  birthDate: string; // YYYY-MM-DD or ''
}

/** Error for the birth date field, if any: not in the future, at most 24 months back. */
export function birthDateError(birthDate: string, now = Date.now()): string | undefined {
  if (!birthDate) return undefined;
  const problem = birthDateProblem(birthDate, now);
  return problem === 'future' ? t.profile.birthFuture : problem === 'tooOld' ? t.profile.birthTooOld : undefined;
}

/** Baby name and birth date, both optional (spec 6.7); shared by first start and "Profil bearbeiten". */
export function ProfileFields(props: { form: ProfileForm; onChange: (form: ProfileForm) => void; error: string | undefined }) {
  const { form, onChange, error } = props;
  return (
    <>
      <div class="field">
        <label class="field-label" for="profile-name">
          {t.profile.name} <span class="field-optional">{t.profile.optional}</span>
        </label>
        <input
          id="profile-name"
          class="input"
          type="text"
          autoComplete="off"
          maxLength={BABY_NAME_MAX}
          value={form.babyName}
          onInput={(e) => onChange({ ...form, babyName: e.currentTarget.value })}
        />
      </div>
      <div class="field">
        <label class="field-label" for="profile-birth">
          {t.profile.birthDate} <span class="field-optional">{t.profile.optional}</span>
        </label>
        <input
          id="profile-birth"
          class="input"
          type="date"
          min={earliestBirthDate(Date.now())}
          max={isoDate(Date.now())}
          value={form.birthDate}
          onInput={(e) => onChange({ ...form, birthDate: e.currentTarget.value })}
          onChange={(e) => onChange({ ...form, birthDate: e.currentTarget.value })}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'profile-birth-error' : undefined}
        />
        {error && (
          <p id="profile-birth-error" class="field-error">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
