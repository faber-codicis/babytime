import { useEffect, useState } from 'preact/hooks';
import { getLastExportAt, setTutorialPending } from '../data/appState';
import { getLanguageChoice, phoneLanguages, pickLang, saveLanguageChoice, type LanguageChoice } from '../data/language';
import type { Profile } from '../data/profile';
import { formatAge, formatDaysAgo, formatStamp } from '../logic/time';
import { t } from '../strings';
import { Avatar } from '../ui/Avatar';
import { FEEDBACK_EMAIL, feedbackMailto } from '../ui/feedback';
import { GUIDE_ANCHOR, showPendingGuideTarget } from '../ui/Guide';
import { useLive, useNow } from '../ui/hooks';
import { Icon } from '../ui/icons';
import { InstallSection, isInstalled } from '../ui/InstallSection';
import { AccentRow, ActionRow, ChoiceRow, LinkRow, SettingsSection, SwitchRow } from '../ui/SettingsRows';
import { Snackbar, type SnackMessage } from '../ui/Snackbar';
import { useAccent, useThemeMode } from '../ui/theme';
import { ACCENTS } from '../data/theme';
import { getTrackers, isLastTracker, setTracker, TRACKER_KINDS, type TrackerKey } from '../data/trackers';
import type { IconName } from '../ui/icons';
import { useDataActions } from '../ui/useDataActions';
import { VersionDetails } from '../ui/VersionPill';

let snackId = 0;

const birthFormat = new Intl.DateTimeFormat(t.locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

/** "09.10.2026" (German) or "09/10/2026" (English) from YYYY-MM-DD, as a local date. */
const formatBirthDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return birthFormat.format(new Date(y, m - 1, d));
};

/** Option names in their own language, so each is recognisable whatever language is showing (0.14.0). */
const LANGUAGE_OPTIONS = [
  ['auto', t.language.auto],
  ['de', 'Deutsch'],
  ['en', 'English'],
] as const satisfies readonly (readonly [LanguageChoice, string])[];

/** What "System" picks right now, by its own name (0.15.2). */
const detectedLanguage = () => (pickLang('auto', phoneLanguages()) === 'de' ? 'Deutsch' : 'English');

/** The whole UI text is fixed per start, so a new language means a restart (entries stay, a running feed too). */
function changeLanguage(choice: LanguageChoice): void {
  saveLanguageChoice(choice);
  location.reload();
}

const TRACKER_ICON: Record<(typeof TRACKER_KINDS)[number], IconName> = {
  feed: 'drop',
  bottle: 'bottle',
  pump: 'pump',
  diaper: 'diaper',
  sleep: 'moon',
};

/** Settings tab (0.4.0, mockup "Einstellungen"): profile, look, data, about the app. */
export function Settings({ profile }: { profile: Profile }) {
  const now = useNow(60_000);
  const [snack, setSnack] = useState<SnackMessage>();
  const message = (text: string) => setSnack({ id: ++snackId, text });
  const data = useDataActions(profile, message);
  const [themeMode, setThemeMode] = useThemeMode();
  const [accent, setAccent] = useAccent();
  const lastExportAt = useLive(getLastExportAt, []);
  const trackers = useLive(getTrackers, []);
  // A guide's button ("Zur Sprache", "Zum Feedback") leads here: show and mark that row.
  useEffect(showPendingGuideTarget, []);
  const toggleTracker = (key: TrackerKey, on: boolean) => {
    if (!trackers) return;
    if (!on && isLastTracker(trackers, key)) {
      message(t.trackers.lastOn);
      return;
    }
    void setTracker(key, on);
  };

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

      <SettingsSection id="settings-trackers" title={t.trackers.title}>
        <div class="data-group">
          {TRACKER_KINDS.map((key) => (
            <SwitchRow
              key={key}
              icon={TRACKER_ICON[key]}
              label={t.trackers[key]}
              hint={t.trackers[`${key}Hint`]}
              checked={trackers?.[key] ?? true}
              onChange={(on) => toggleTracker(key, on)}
            />
          ))}
        </div>
        <div class="data-group">
          <SwitchRow
            icon="star"
            label={t.trackers.milestones}
            hint={t.trackers.milestonesHint}
            checked={trackers?.milestones ?? true}
            onChange={(on) => toggleTracker('milestones', on)}
          />
        </div>
        <p class="settings-note">{t.trackers.note}</p>
      </SettingsSection>

      <SettingsSection id="settings-look" title={t.settings.sectionLook}>
        <div class="data-group">
          <SwitchRow
            icon="history"
            label={t.data.timeline}
            hint={t.data.timelineHint}
            checked={trackers?.timeline ?? true}
            onChange={(on) => toggleTracker('timeline', on)}
          />
          <SwitchRow
            icon="moon"
            label={t.data.darkMode}
            hint={t.data.darkModeHint}
            checked={themeMode === 'dark'}
            onChange={(on) => setThemeMode(on ? 'dark' : 'light')}
          />
          {/* Both rows are one choice: switching one on switches the other off. */}
          <SwitchRow
            icon="clock"
            label={t.data.nightMode}
            hint={t.data.nightModeHint}
            checked={themeMode === 'night'}
            onChange={(on) => setThemeMode(on ? 'night' : 'light')}
          />
          <AccentRow
            label={t.data.accent}
            hint={t.data.accentHint}
            options={ACCENTS}
            names={t.data.accentNames}
            value={accent}
            onChange={setAccent}
          />
          <ChoiceRow
            id={GUIDE_ANCHOR.language}
            icon="globe"
            label={t.language.label}
            hint={t.language.hint(detectedLanguage())}
            groupLabel={t.language.a11y}
            options={LANGUAGE_OPTIONS}
            value={getLanguageChoice()}
            onChange={changeLanguage}
          />
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
          <ActionRow icon="shield" label={t.data.exportEncrypted} hint={t.data.exportEncryptedHint} onClick={data.openEncryptedExport} />
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
        <div class="data-group">
          <ActionRow
            id={GUIDE_ANCHOR.tutorial}
            icon="info"
            label={t.tutorial.open}
            hint={t.tutorial.openHint}
            onClick={() => void setTutorialPending(true)}
          />
          <LinkRow
            id={GUIDE_ANCHOR.feedback}
            icon="mail"
            label={t.feedback.label}
            hint={t.feedback.hint(FEEDBACK_EMAIL)}
            href={feedbackMailto(__APP_VERSION__, formatStamp(__BUILD_TIME__), navigator.userAgent, isInstalled())}
          />
        </div>
        <InstallSection />
        <p class="settings-note settings-privacy">
          <Icon name="shield" size={16} />
          {t.settings.privacy}
        </p>
        <p class="settings-note">{t.settings.privacyMore}</p>
        <p class="settings-note">{t.settings.beta}</p>
        <p class="settings-note">{t.settings.medical}</p>
      </SettingsSection>

      <div class="snack-anchor">
        <Snackbar message={snack} onDone={() => setSnack(undefined)} />
      </div>
      {data.sheets}
    </div>
  );
}
