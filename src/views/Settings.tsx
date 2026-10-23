import { useState } from 'preact/hooks';
import { getLastExportAt } from '../data/appState';
import type { Profile } from '../data/profile';
import { formatAge, formatDaysAgo } from '../logic/time';
import { t } from '../strings.de';
import { Avatar } from '../ui/Avatar';
import { useLive, useNow } from '../ui/hooks';
import { Icon } from '../ui/icons';
import { InstallSection } from '../ui/InstallSection';
import { ActionRow, SettingsSection, SwitchRow } from '../ui/SettingsRows';
import { Snackbar, type SnackMessage } from '../ui/Snackbar';
import { useDarkTheme } from '../ui/theme';
import { useDataActions } from '../ui/useDataActions';
import { VersionDetails } from '../ui/VersionPill';

let snackId = 0;

/** "09.10.2026" from YYYY-MM-DD. */
const formatBirthDate = (iso: string) => iso.split('-').reverse().join('.');

/** Settings tab (0.4.0, mockup "Einstellungen"): profile, look, data, about the app. */
export function Settings({ profile }: { profile: Profile }) {
  const now = useNow(60_000);
  const [snack, setSnack] = useState<SnackMessage>();
  const message = (text: string) => setSnack({ id: ++snackId, text });
  const data = useDataActions(profile, message);
  const [dark, setDark] = useDarkTheme();
  const lastExportAt = useLive(getLastExportAt, []);

  const age = profile.birthDate ? formatAge(profile.birthDate, now) : undefined;
  const profileLine = profile.birthDate ? [formatBirthDate(profile.birthDate), age].filter(Boolean).join(' · ') : undefined;

  return (
    <div class="settings">
      <h1 class="screen-title">{t.settings.title}</h1>

      <section class="settings-card profile-card" aria-label={t.settings.editProfile}>
        <Avatar profile={profile} size={64} />
        <div class="profile-card-text">
          <p class="profile-card-name">{profile.babyName ?? t.defaultBabyName}</p>
          <p class="profile-card-sub">{profileLine ?? (profile.babyName ? '' : t.settings.addName)}</p>
        </div>
        <button type="button" class="round-btn round-btn--tint" aria-label={t.settings.editProfile} onClick={data.openProfile}>
          <Icon name="pencil" size={20} />
        </button>
      </section>

      <SettingsSection id="settings-look" title={t.settings.sectionLook}>
        <div class="data-group">
          <SwitchRow icon="moon" label={t.data.darkMode} hint={t.data.darkModeHint} checked={dark} onChange={setDark} />
        </div>
      </SettingsSection>

      <SettingsSection id="settings-data" title={t.settings.sectionData}>
        <div class="data-group">
          <ActionRow
            icon="download"
            label={t.data.export}
            hint={lastExportAt === undefined ? t.settings.noBackup : t.settings.lastBackup(formatDaysAgo(lastExportAt, now))}
            disabled={!data.exportNow}
            onClick={() => data.exportNow?.()}
          />
          <ActionRow icon="upload" label={t.data.restore} onClick={data.openRestore} />
        </div>
        <p class="settings-note">{t.data.exportHint}</p>
        <div class="data-group">
          <ActionRow icon="trash" label={t.data.deleteAll} hint={t.data.deleteAllHint} warn onClick={data.openDeleteAll} />
        </div>
      </SettingsSection>

      <SettingsSection id="settings-about" title={t.settings.sectionAbout}>
        <div class="settings-card">
          <VersionDetails />
        </div>
        <InstallSection />
        <p class="settings-note settings-privacy">
          <Icon name="shield" size={16} />
          {t.settings.privacy}
        </p>
      </SettingsSection>

      <div class="snack-anchor">
        <Snackbar message={snack} onDone={() => setSnack(undefined)} />
      </div>
      {data.sheets}
    </div>
  );
}
