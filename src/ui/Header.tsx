import type { Profile } from '../data/profile';
import { formatAge, formatClock, formatWeekday } from '../logic/time';
import { t } from '../strings.de';
import { Avatar } from './Avatar';
import { VersionPill } from './VersionPill';

export function Header({ profile, now }: { profile: Profile | undefined; now: number }) {
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
      <VersionPill />
    </header>
  );
}
