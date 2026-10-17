import { useEffect, useState } from "react";
import Icon from "./Icon";

type MenuItem = { label: string; onSelect: () => void; danger?: boolean };

function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  // Fixed position so the menu isn't clipped by the scrolling table wrapper.
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  return (
    <span className="row-menu" onClick={(event) => event.stopPropagation()}>
      <button
        className="table-menu"
        aria-label={label}
        aria-expanded={Boolean(position)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition((current) => (current ? null : { top: rect.bottom + 4, right: window.innerWidth - rect.right }));
        }}
      >
        <Icon name="dots" />
      </button>
      {position && (
        <>
          <span className="menu-scrim" onClick={() => setPosition(null)} />
          <span className="popover popover-fixed" role="menu" style={position}>
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                className={item.danger ? "danger" : ""}
                onClick={() => {
                  setPosition(null);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
}

export default RowMenu;
