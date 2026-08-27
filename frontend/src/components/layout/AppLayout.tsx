import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">WorkZen</span>
        <nav className="app-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/clients"
            className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}
          >
            Clientes
          </NavLink>
          <NavLink
            to="/services"
            className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}
          >
            Serviços
          </NavLink>
          <NavLink
            to="/appointments"
            className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}
          >
            Agendamentos
          </NavLink>
        </nav>
        <div className="app-header-right">
          <span className="app-user-email">{user?.email}</span>
          <button className="app-logout-button" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}