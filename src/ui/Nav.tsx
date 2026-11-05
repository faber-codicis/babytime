import { hashOf, type Route } from '../router';
import { t } from '../strings.de';
import { Icon, type IconName } from './icons';

const TABS: { route: Route; icon: IconName; label: string }[] = [
  { route: 'today', icon: 'home', label: t.nav.today },
  { route: 'history', icon: 'history', label: t.nav.history },
  { route: 'milestones', icon: 'star', label: t.nav.milestones },
  { route: 'settings', icon: 'sliders', label: t.nav.settings },
];

/** Bottom tab bar (spec 6.1, mockup "Navigation"): four tabs, three with Meilensteine switched off; the active one in a rosé pill. */
export function Nav({ route, milestones }: { route: Route; milestones: boolean }) {
  return (
    <nav class={`tabbar${milestones ? ' tabbar--four' : ''}`} aria-label={t.nav.a11y}>
      {TABS.filter((tab) => milestones || tab.route !== 'milestones').map((tab) => {
        const active = tab.route === route;
        return (
          <a key={tab.route} href={hashOf(tab.route)} class={`tab${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <span class="tab-pill">
              <Icon name={tab.icon} size={22} />
            </span>
            <span class="tab-label">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
