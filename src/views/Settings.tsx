import { useEffect, useState } from 'preact/hooks';
import { getLastExportAt, setTutorialPending } from '../data/appState';
import { getFirstEventStart } from '../data/events';
import { getLanguageChoice, phoneLanguages, pickLang, saveLanguageChoice, type LanguageChoice } from '../data/language';
import type { Profile } from '../data/profile';
import { ACCENTS, type ThemeMode } from '../data/theme';
import { getTrackers, isLastTracker, setTracker, TRACKER_KINDS, type TrackerKey, type Trackers } from '../data/trackers';
import { shouldRemindBackup } from '../logic/backupReminder';
import { formatAge, formatDaysAgo, formatStamp } from '../logic/time';
import { goBack, hashOf, type SettingsPage } from '../router';
import { t } from '../strings';
import { Avatar } from '../ui/Avatar';
import { FEEDBACK_EMAIL, feedbackMailto } from '../ui/feedback';
import { GUIDE_ANCHOR, showPendingGuideTarget } from '../ui/Guide';
import { useLive, useNow } from '../ui/hooks';
import { Icon, type IconName } from '../ui/icons';
import { InstallSection, isInstalled } from '../ui/InstallSection';
import { PrivacySheet } from '../ui/PrivacySheet';
import { AccentRow, ActionRow, LinkRow, NavRow, SelectRow, SettingsSection, SwitchRow } from '../ui/SettingsRows';
import { Snackbar, type SnackMessage } from '../ui/Snackbar';
import { useAccent, useThemeMode } from '../ui/theme';
import { useDataActions } from '../ui/useDataActions';
import { VersionDetails } from '../ui/VersionPill';

let snackId = 0;

const birthFormat = new Intl.DateTimeFormat(t.locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

/** "09.10.2026" (German) or "09/10/2026" (English) from YYYY-MM-DD, as a local date. */
const formatBirthDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return birthFormat.format(new Date(y, m - 1, d));
};

/** What "System" picks right now, by its own name (0.15.2). */
const detectedLanguage = () => (pickLang('auto', phoneLanguages()) === 'de' ? 'Deutsch' : 'English');

/** Option names in their own language, so each is recognisable whatever language is showing (0.14.0). */
const languageOptions = () =>
  [
    ['auto', t.language.autoNow(detectedLanguage())],
    ['de', 'Deutsch'],
    ['en', 'English'],
  ] as const satisfies readonly (readonly [LanguageChoice, string])[];

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

const THEME_MODES = [
  ['light', 'sun'],
  ['dark', 'moon'],
  ['night', 'clock'],
] as const satisfies readonly (readonly [ThemeMode, IconName])[];

/** Trackers that can be switched on and off: the five on Today plus Meilensteine. */
const TRACKER_KEYS = [...TRACKER_KINDS, 'milestones'] as const;

/**
 * Settings tab. Since 0.17.0 a short overview in groups (owner's choice "Variante B", mockups in design-0.17.0)
 * with four sub pages: Erfassen, Darstellung, Daten & Backup, Über die App. Language, guide and feedback stay on the
 * overview, so the guides' buttons still land on a visible row.
 */
export function Settings({ profile, page }: { profile: Profile; page: SettingsPage }) {
  const now = useNow(60_000);
  const [snack, setSnack] = useState<SnackMessage>();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const message = (text: string) => setSnack({ id: ++snackId, text });
  const data = useDataActions(profile, message);
  const trackers = useLive(getTrackers, []);
  // A new page starts at the top; a guide's button ("Zur Sprache", "Zum Feedback") then shows and marks its row.
  useEffect(() => {
    window.scrollTo(0, 0);
    showPendingGuideTarget();
  }, [page]);

  const toggleTracker = (key: TrackerKey, on: boolean) => {
    if (!trackers) return;
    if (!on && isLastTracker(trackers, key)) {
      message(t.trackers.lastOn);
      return;
    }
    void setTracker(key, on);
  };

  const body =
    page === 'settingsTrackers' ? (
      <TrackersPage trackers={trackers} onToggle={toggleTracker} />
    ) : page === 'settingsLook' ? (
      <LookPage trackers={trackers} onToggle={toggleTracker} />
    ) : page === 'settingsData' ? (
      <DataPage data={data} now={now} hasPhoto={profile.photo !== undefined} />
    ) : page === 'settingsAbout' ? (
      <AboutPage onPrivacy={() => setPrivacyOpen(true)} />
    ) : (
      <Overview profile={profile} trackers={trackers} now={now} onEditProfile={data.openProfile} />
    );

  return (
    <div class="settings">
      {body}
      <div class="snack-anchor">
        <Snackbar message={snack} onDone={() => setSnack(undefined)} />
      </div>
      {data.sheets}
      <PrivacySheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}

/** Heading of a sub page with the way back to the overview. */
function SubHead({ title }: { title: string }) {
  return (
    <header class="screen-head">
      <button type="button" class="round-btn round-btn--tint" aria-label={t.settings.back} onClick={() => goBack('settings')}>
        <Icon name="back" size={22} />
      </button>
      <h1 class="screen-title">{title}</h1>
    </header>
  );
}

function Overview(props: { profile: Profile; trackers: Trackers | undefined; now: number; onEditProfile: () => void }) {
  const { profile, trackers, now } = props;
  const [themeMode] = useThemeMode();
  const [accent] = useAccent();
  const backup = useLive(async () => ({ lastExportAt: await getLastExportAt(), firstEventAt: await getFirstEventStart() }), []);

  const age = profile.birthDate ? formatAge(profile.birthDate, now) : undefined;
  const profileLine = profile.birthDate ? [formatBirthDate(profile.birthDate), age].filter(Boolean).join(' · ') : undefined;
  const trackersOn = trackers ? TRACKER_KEYS.filter((key) => trackers[key]).length : TRACKER_KEYS.length;
  const lookLine = [t.data.themeNames[themeMode], t.data.accentNames[accent], ...(trackers?.timeline === false ? [] : [t.data.timelineOn])].join(' · ');
  const backupLine = backup?.lastExportAt === undefined ? t.settings.noBackup : t.settings.lastBackup(formatDaysAgo(backup.lastExportAt, now));
  // Same rule as the reminder card on Today: a dot when a backup is due (never only colour: the text says when).
  const backupDue = backup !== undefined && shouldRemindBackup({ ...backup, dismissedAt: undefined, now });

  return (
    <>
      <h1 class="screen-title">{t.settings.title}</h1>

      <section class="settings-card profile-card" aria-label={t.settings.editProfile}>
        <Avatar profile={profile} size={64} />
        <div class="profile-card-text">
          <p class="profile-card-name">{profile.babyName ?? t.defaultBabyName}</p>
          <p class="profile-card-sub">{profileLine ?? (profile.babyName ? '' : t.settings.addName)}</p>
        </div>
        <button
          type="button"
          id={GUIDE_ANCHOR.profile}
          class="round-btn round-btn--tint"
          aria-label={t.settings.editProfile}
          onClick={props.onEditProfile}
        >
          <Icon name="pencil" size={20} />
        </button>
      </section>

      <SettingsSection id="settings-daily" title={t.settings.groupDaily}>
        <div class="data-group">
          <NavRow icon="list" label={t.settings.trackers} hint={t.settings.trackersOn(trackersOn, TRACKER_KEYS.length)} href={hashOf('settingsTrackers')} />
          <NavRow
            icon="download"
            label={t.settings.sectionData}
            hint={
              <>
                {backupDue && <span class="due-dot" aria-hidden="true" />}
                {backupLine}
              </>
            }
            href={hashOf('settingsData')}
          />
        </div>
      </SettingsSection>

      <SettingsSection id="settings-customize" title={t.settings.groupCustomize}>
        <div class="data-group">
          <NavRow icon="palette" label={t.settings.sectionLook} hint={lookLine} href={hashOf('settingsLook')} />
          <SelectRow
            id={GUIDE_ANCHOR.language}
            icon="globe"
            label={t.language.label}
            options={languageOptions()}
            value={getLanguageChoice()}
            onChange={changeLanguage}
          />
        </div>
      </SettingsSection>

      <SettingsSection id="settings-help" title={t.settings.groupHelp}>
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
          <NavRow icon="phone" label={t.settings.sectionAbout} hint={t.settings.aboutSummary(__APP_VERSION__)} href={hashOf('settingsAbout')} />
        </div>
      </SettingsSection>

      <p class="settings-note settings-privacy">
        <Icon name="shield" size={16} />
        {t.settings.privacy}
      </p>
    </>
  );
}

function TrackersPage(props: { trackers: Trackers | undefined; onToggle: (key: TrackerKey, on: boolean) => void }) {
  const { trackers, onToggle } = props;
  return (
    <>
      <SubHead title={t.settings.trackers} />
      <SettingsSection id="settings-trackers" title={t.trackers.title}>
        <div class="data-group">
          {TRACKER_KINDS.map((key) => (
            <SwitchRow
              key={key}
              icon={TRACKER_ICON[key]}
              label={t.trackers[key]}
              hint={t.trackers[`${key}Hint`]}
              checked={trackers?.[key] ?? true}
              onChange={(on) => onToggle(key, on)}
            />
          ))}
        </div>
        <div class="data-group">
          <SwitchRow
            icon="star"
            label={t.trackers.milestones}
            hint={t.trackers.milestonesHint}
            checked={trackers?.milestones ?? true}
            onChange={(on) => onToggle('milestones', on)}
          />
        </div>
        <p class="settings-note">{t.trackers.note}</p>
      </SettingsSection>
    </>
  );
}

function LookPage(props: { trackers: Trackers | undefined; onToggle: (key: TrackerKey, on: boolean) => void }) {
  const [themeMode, setThemeMode] = useThemeMode();
  const [accent, setAccent] = useAccent();
  return (
    <>
      <SubHead title={t.settings.sectionLook} />
      {/* Light, dark and dark at night were two switches until 0.16; one choice of three since 0.17.0. */}
      <SettingsSection id="settings-theme" title={t.data.theme}>
        <div class="segmented theme-choice" role="group" aria-labelledby="settings-theme">
          {THEME_MODES.map(([mode, icon]) => (
            <button
              key={mode}
              type="button"
              class={`segment${mode === themeMode ? ' is-active' : ''}`}
              aria-pressed={mode === themeMode}
              onClick={() => setThemeMode(mode)}
            >
              <Icon name={icon} size={20} />
              {t.data.themeNames[mode]}
            </button>
          ))}
        </div>
        <p class="settings-note">{t.data.themeHints[themeMode]}</p>
      </SettingsSection>

      <SettingsSection id="settings-colour" title={t.data.colourAndView}>
        <div class="data-group">
          <AccentRow label={t.data.accent} hint={t.data.accentHint} options={ACCENTS} names={t.data.accentNames} value={accent} onChange={setAccent} />
          <SwitchRow
            icon="history"
            label={t.data.timeline}
            hint={t.data.timelineHint}
            checked={props.trackers?.timeline ?? true}
            onChange={(on) => props.onToggle('timeline', on)}
          />
        </div>
      </SettingsSection>
    </>
  );
}

function DataPage({ data, now, hasPhoto }: { data: ReturnType<typeof useDataActions>; now: number; hasPhoto: boolean }) {
  const lastExportAt = useLive(getLastExportAt, []);
  return (
    <>
      <SubHead title={t.settings.sectionData} />
      <section class="settings-card backup-card" aria-labelledby="backup-status">
        <div class="backup-status">
          <span class="data-action-icon" aria-hidden="true">
            <Icon name="download" size={20} />
          </span>
          <span class="data-action-text">
            <span class="data-action-label" id="backup-status">
              {lastExportAt === undefined ? t.settings.noBackup : t.settings.lastBackup(formatDaysAgo(lastExportAt, now))}
            </span>
            <span class="data-action-hint">{t.data.backupNudge}</span>
            {hasPhoto && <span class="data-action-hint">{t.data.backupHasPhoto}</span>}
          </span>
        </div>
        <button type="button" class="big-btn big-btn--rose big-btn--wide" disabled={!data.exportNow} onClick={() => data.exportNow?.()}>
          {t.data.export}
        </button>
      </section>
      <div class="data-group">
        <ActionRow icon="shield" label={t.data.exportEncrypted} hint={t.data.exportEncryptedHint} onClick={data.openEncryptedExport} />
        <ActionRow icon="upload" label={t.data.restore} onClick={data.openRestore} />
      </div>
      <details class="settings-note settings-more">
        <summary>
          {t.data.exportHint} <span class="settings-more-link">{t.data.exportHintMore}</span>
        </summary>
        <p>{t.data.exportHintMoreText}</p>
      </details>
      <div class="data-group">
        <ActionRow icon="trash" label={t.data.deleteAll} hint={t.data.deleteAllHint} warn onClick={data.openDeleteAll} />
      </div>
    </>
  );
}

function AboutPage({ onPrivacy }: { onPrivacy: () => void }) {
  return (
    <>
      <SubHead title={t.settings.sectionAbout} />
      <div class="settings-card">
        <VersionDetails />
      </div>
      <div class="data-group">
        <ActionRow icon="shield" label={t.privacy.open} hint={t.privacy.openHint} onClick={onPrivacy} />
      </div>
      <InstallSection />
      <div class="settings-notes">
        <p class="settings-note">{t.settings.beta}</p>
        <p class="settings-note">{t.settings.medical}</p>
      </div>
    </>
  );
}
