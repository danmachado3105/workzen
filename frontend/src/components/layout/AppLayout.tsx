import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">WorkZen</span>
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