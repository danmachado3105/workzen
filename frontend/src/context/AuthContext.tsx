import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import * as authApi from "../api/auth";
import type { LoginPayload, RegisterPayload, User } from "../types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "workzen_token";
const USER_KEY = "workzen_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  async function login(payload: LoginPayload) {
    const authResponse = await authApi.login(payload);
    localStorage.setItem(TOKEN_KEY, authResponse.access_token);

    // O backend não devolve os dados do usuário no login, só o token.
    // Por enquanto guardamos um usuário mínimo com o email informado;
    // isso será refinado quando tivermos uma rota "/auth/me" ou similar.
    const minimalUser = { email: payload.email } as User;
    localStorage.setItem(USER_KEY, JSON.stringify(minimalUser));
    setUser(minimalUser);
  }

  async function register(payload: RegisterPayload) {
    await authApi.register(payload);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return context;
}