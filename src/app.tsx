import { getProfile } from './data/profile';
import { useRoute } from './router';
import { useLive } from './ui/hooks';
import { Nav } from './ui/Nav';
import { UpdateDialog } from './ui/UpdateDialog';
import { useUpdatePopup } from './ui/useUpdatePopup';
import { Breastfeeding } from './views/Breastfeeding';
import { History } from './views/History';
import { Onboarding } from './views/Onboarding';
import { Settings } from './views/Settings';
import { Today } from './views/Today';
import { WhatsNew } from './views/WhatsNew';

export function App() {
  const route = useRoute();
  const profile = useLive(getProfile, []);
  const update = useUpdatePopup(Boolean(profile?.onboarded), route);

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
  const withNav = route === 'today' || route === 'history' || route === 'settings';
  const view =
    route === 'feeding' ? (
      <Breastfeeding />
    ) : route === 'history' ? (
      <History />
    ) : route === 'settings' ? (
      <Settings profile={profile} />
    ) : route === 'whatsnew' ? (
      <WhatsNew />
    ) : (
      <Today profile={profile} />
    );

  return (
    <>
      <main class={`app${withNav ? ' app--with-nav' : ''}`}>{view}</main>
      {withNav && <Nav route={route} />}
      <UpdateDialog entries={update.entries} onDismiss={update.dismiss} onShowAll={update.showAll} />
    </>
  );
}
