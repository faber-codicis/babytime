import { getProfile } from './data/profile';
import { DEFAULT_TRACKERS, getTrackers } from './data/trackers';
import { useRoute } from './router';
import { useLive } from './ui/hooks';
import { Nav } from './ui/Nav';
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
  const withNav = page === 'today' || page === 'history' || page === 'milestones' || page === 'settings';
  const view =
    page === 'feeding' ? (
      <Breastfeeding />
    ) : page === 'history' ? (
      <History />
    ) : page === 'milestones' ? (
      <Milestones profile={profile} />
    ) : page === 'settings' ? (
      <Settings profile={profile} />
    ) : page === 'whatsnew' ? (
      <WhatsNew />
    ) : (
      <Today profile={profile} />
    );

  return (
    <>
      <main class={`app${withNav ? ' app--with-nav' : ''}`}>{view}</main>
      {withNav && <Nav route={page} milestones={trackers.milestones} />}
      <UpdateDialog entries={update.entries} onDismiss={update.dismiss} onShowAll={update.showAll} onGuide={update.openGuide} />
    </>
  );
}
