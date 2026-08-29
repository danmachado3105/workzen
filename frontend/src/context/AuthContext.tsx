import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import * as authApi from "../api/auth";
import type { LoginPayload, RegisterPayload, UpdateProfilePayload, User } from "../types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
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

    async function restoreSession() {
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as User);
        } catch {
          localStorage.removeItem(USER_KEY);
        }
      }

      try {
        const currentUser = await authApi.getMe();
        persistUser(currentUser);
      } catch {
        // O interceptor limpa uma sessão expirada. Para uma falha temporária de rede,
        // o perfil persistido continua disponível até a próxima tentativa.
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  function persistUser(nextUser: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  async function login(payload: LoginPayload) {
    const authResponse = await authApi.login(payload);
    localStorage.setItem(TOKEN_KEY, authResponse.access_token);
    persistUser(authResponse.user);
  }

  async function register(payload: RegisterPayload) {
    await authApi.register(payload);
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    const updatedUser = await authApi.updateProfile(payload);
    persistUser(updatedUser);
    return updatedUser;
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
        updateProfile,
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
