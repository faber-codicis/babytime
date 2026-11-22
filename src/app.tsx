import { isTutorialPending, setTutorialPending } from './data/appState';
import { getProfile } from './data/profile';
import { DEFAULT_TRACKERS, getTrackers } from './data/trackers';
import { isSettingsPage, useRoute } from './router';
import { useLive } from './ui/hooks';
import { Nav } from './ui/Nav';
import { Tutorial } from './ui/Tutorial';
import { UpdateDialog } from './ui/UpdateDialog';
import { useAutoTheme } from './ui/theme';
import { useUpdatePopup } from './ui/useUpdatePopup';
import { Breastfeeding } from './views/Breastfeeding';
import { History } from './views/History';
import { Milestones } from './views/Milestones';
import { Onboarding } from './views/Onboarding';
import { Settings } from './views/Settings';
import { Today } from './views/Today';
import { WhatsNew } from './views/WhatsNew';

export function App() {
  const route = useRoute();
  const profile = useLive(getProfile, []);
  const trackers = useLive(getTrackers, []) ?? DEFAULT_TRACKERS;
  const update = useUpdatePopup(Boolean(profile?.onboarded), route);
  const tutorial = useLive(isTutorialPending, []) ?? false;
  useAutoTheme();

  // Wait for the profile, so the first start never flashes Today (the splash covers this moment).
  if (!profile) return null;

  if (!profile.onboarded) {
    return (
      <main class="app">
        <Onboarding />
      </main>
    );
  }

  // No tab bar on the running feed and on "Was ist neu" (spec 6.1, 6).
  // Meilensteine switched off: its address shows Today (and the tab bar has three tabs, mockup "Navigation").
  const page = route === 'milestones' && !trackers.milestones ? 'today' : route;
  const withNav = page === 'today' || page === 'history' || page === 'milestones' || isSettingsPage(page);
  const view =
    page === 'feeding' ? (
      <Breastfeeding />
    ) : page === 'history' ? (
      <History />
    ) : page === 'milestones' ? (
      <Milestones profile={profile} />
    ) : isSettingsPage(page) ? (
      <Settings profile={profile} page={page} />
    ) : page === 'whatsnew' ? (
      <WhatsNew />
    ) : (
      <Today profile={profile} />
    );

  return (
    <>
      <main class={`app${withNav ? ' app--with-nav' : ''}`}>{view}</main>
      {withNav && <Nav route={isSettingsPage(page) ? 'settings' : page} milestones={trackers.milestones} />}
      {/* Never over a running feed, and never together with the update popup. */}
      <Tutorial open={tutorial && page !== 'feeding' && !update.entries} onClose={() => void setTutorialPending(false)} />
      <UpdateDialog entries={update.entries} onDismiss={update.dismiss} onShowAll={update.showAll} onGuide={update.openGuide} />
    </>
  );
}
