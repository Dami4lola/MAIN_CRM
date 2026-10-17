import { COMPANY } from "../brand";
import Icon, { type IconName } from "./Icon";
import ProfileMenu, { type Identity } from "./ProfileMenu";

export type NavItem = { key: string; label: string; icon: IconName; count?: number };

type Props = {
  items: NavItem[];
  active: string;
  identity: Identity;
  onSelect: (key: string) => void;
  onSwitchRole: () => void;
  onSettings?: () => void;
  settingsActive: boolean;
};

function Sidebar({ items, active, identity, onSelect, onSwitchRole, onSettings, settingsActive }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><Icon name="flame" size={19} /></span>
        <span>North<span>line</span><small>{COMPANY.tagline}</small></span>
      </div>
      <nav className="main-nav" aria-label="Main navigation">
        {items.map((item) => (
          <button key={item.key} className={active === item.key && !settingsActive ? "nav-item active" : "nav-item"} aria-label={item.label} title={item.label} aria-current={active === item.key ? "page" : undefined} onClick={() => onSelect(item.key)}>
            <Icon name={item.icon} /><span>{item.label}</span>
            {item.count ? <span className="nav-count">{item.count}</span> : null}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        {onSettings && (
          <button className={settingsActive ? "nav-item active" : "nav-item"} aria-label="Settings" title="Settings" onClick={onSettings}><Icon name="settings" /><span>Settings</span></button>
        )}
        <div className="help-card">
          <span className="help-icon">O</span>
          <strong>Built by {COMPANY.builtBy}</strong>
          <p>Custom field-ops software for trades. Demo company with sample data.</p>
          <button onClick={onSwitchRole}>Switch role</button>
        </div>
        <ProfileMenu identity={identity} onSwitchRole={onSwitchRole} onSettings={onSettings} placement="up" />
      </div>
    </aside>
  );
}

export default Sidebar;
