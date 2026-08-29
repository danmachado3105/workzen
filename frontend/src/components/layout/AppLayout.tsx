import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/appointments", label: "Agenda" },
  { to: "/clients", label: "Clientes" },
  { to: "/services", label: "Serviços" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">WorkZen</div>

        <nav className="app-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "app-sidebar-link active" : "app-sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
          <span className="app-sidebar-link disabled" title="Em breve">
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