import type { Profile } from '../data/profile';
import { formatAge, formatClock, formatWeekday } from '../logic/time';
import { t } from '../strings';
import { Avatar } from './Avatar';
import { Icon } from './icons';
import { VersionPill } from './VersionPill';

/** `onNightView`: at night, after the sun button, a moon button leads back to the night view. */
export function Header({ profile, now, onNightView }: { profile: Profile | undefined; now: number; onNightView?: (() => void) | undefined }) {
  const name = profile?.babyName ?? t.defaultBabyName;
  const age = profile?.birthDate ? formatAge(profile.birthDate, now) : undefined;
  const parts = [age, `${formatWeekday(now)}, ${formatClock(now)}`];

  return (
    <header class="header">
      <Avatar profile={profile} />
      <div class="header-text">
        <h1 class="header-name">{name}</h1>
        <p class="header-sub">{parts.filter(Boolean).join(' · ')}</p>
      </div>
      {onNightView && (
        <button type="button" class="round-btn header-night-btn" aria-label={t.night.nightView} onClick={onNightView}>
          <Icon name="moon" size={20} />
        </button>
      )}
      <VersionPill />
    </header>
  );
}
