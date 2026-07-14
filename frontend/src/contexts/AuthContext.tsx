import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { apiLogin, apiLogout, apiMe, apiRegister } from '../services/api';

export interface AuthResident {
  id: string;
  nickname: string;
  fullName: string;
  phone?: string | null;
  category?: string;
  role: 'resident' | 'admin';
  isActive: boolean;
  mustChangePassword: boolean;
}

interface AuthContextType {
  resident: AuthResident | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (nickname: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
  updateResident: (patch: Partial<AuthResident>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'caixinha_token';
const RESIDENT_KEY = 'caixinha_resident';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [resident, setResident] = useState<AuthResident | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura a sessão a partir do token salvo, revalidando contra o backend
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setAccessToken(storedToken);

    apiMe()
      .then((me) => {
        setResident(me);
        localStorage.setItem(RESIDENT_KEY, JSON.stringify(me));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(RESIDENT_KEY);
        setAccessToken(null);
        setResident(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persistSession = useCallback((token: string, sessionResident: AuthResident) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(RESIDENT_KEY, JSON.stringify(sessionResident));
    setAccessToken(token);
    setResident(sessionResident);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const { accessToken: token, resident: loggedResident } = await apiLogin(identifier, password);
    persistSession(token, loggedResident);
  }, [persistSession]);

  const register = useCallback(async (nickname: string, fullName: string, password: string) => {
    const { accessToken: token, resident: newResident } = await apiRegister(nickname, fullName, password);
    persistSession(token, newResident);
  }, [persistSession]);

  const logout = useCallback(() => {
    apiLogout().catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(RESIDENT_KEY);
    setResident(null);
    setAccessToken(null);
  }, []);

  const updateResident = useCallback((patch: Partial<AuthResident>) => {
    setResident((prev) => {
      const next = prev ? { ...prev, ...patch } : prev;
      if (next) localStorage.setItem(RESIDENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        resident,
        accessToken,
        isAuthenticated: !!accessToken && !!resident,
        mustChangePassword: resident?.mustChangePassword ?? false,
        isLoading,
        login,
        register,
        logout,
        updateResident,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
