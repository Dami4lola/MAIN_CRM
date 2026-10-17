import { useState, type ReactNode } from "react";
import Icon from "./Icon";

export type Identity = { name: string; subtitle: string; avatar: ReactNode };

type Props = {
  identity: Identity;
  onSwitchRole: () => void;
  onSettings?: () => void;
  placement: "up" | "down";
  compact?: boolean;
};

function ProfileMenu({ identity, onSwitchRole, onSettings, placement, compact = false }: Props) {
  const [open, setOpen] = useState(false);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className={`profile ${compact ? "profile-compact" : ""}`}>
      {!compact && identity.avatar}
      {!compact && <span><strong>{identity.name}</strong><small>{identity.subtitle}</small></span>}
      <button className="profile-menu" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Icon name={compact ? "user" : "dots"} />
      </button>
      {open && (
        <>
          <span className="menu-scrim" onClick={() => setOpen(false)} />
          <div className={`popover role-popover role-popover-${placement}`} role="menu">
            <p className="popover-label">Signed in as</p>
            <p className="popover-identity"><strong>{identity.name}</strong><small>{identity.subtitle}</small></p>
            <hr />
            {onSettings && <button role="menuitem" onClick={() => choose(onSettings)}><Icon name="settings" size={15} />Settings</button>}
            <button role="menuitem" onClick={() => choose(onSwitchRole)}><Icon name="swap" size={15} />Switch role</button>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileMenu;
