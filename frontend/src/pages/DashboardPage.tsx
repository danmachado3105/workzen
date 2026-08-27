import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Logado como: {user?.email}</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
}