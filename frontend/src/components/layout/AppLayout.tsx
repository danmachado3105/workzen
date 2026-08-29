import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/appointments", label: "Agenda", icon: "calendar" },
  { to: "/clients", label: "Clientes", icon: "clients" },
  { to: "/services", label: "Serviços", icon: "services" },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-logo" aria-label="WorkZen">
          <span className="brand-work">Work</span><span className="brand-zen">Zen</span>
        </div>

        <nav className="app-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "app-sidebar-link active" : "app-sidebar-link"
              }
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
          <span className="app-sidebar-link disabled" title="Em breve">
            <NavIcon name="settings" />
            Configurações
          </span>
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user">
            <span className="app-user-avatar">{getInitial(user?.email)}</span>
            <span className="app-user-email">{user?.email}</span>
          </div>
          <button className="app-logout-button" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      <div className="app-body">
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

function getInitial(email?: string): string {
  if (!email) return "?";
  return email.charAt(0).toUpperCase();
}

function NavIcon({ name }: { name: (typeof navItems)[number]["icon"] | "settings" }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    clients: <><circle cx="12" cy="8" r="3.2" /><path d="M5 21c.7-3.7 3.1-5.6 7-5.6s6.3 1.9 7 5.6" /></>,
    services: <><path d="M12 3 4 7v5c0 4.7 3.4 7.7 8 9 4.6-1.3 8-4.3 8-9V7l-8-4Z" /><path d="m8.8 12 2.1 2.1 4.4-4.5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.2 2.2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3.2v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.2-2.2.1-.1A1.7 1.7 0 0 0 6.6 15a1.7 1.7 0 0 0-1.5-1H5v-3.2h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.2-2.2.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h3.2v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.2 2.2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
  };

  return <svg className="app-nav-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
