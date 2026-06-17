/**
 * AuthContext — versão MOCKADA (drop-in).
 *
 * Mantém EXATAMENTE a mesma interface pública da versão final do zip
 * (resident, accessToken, isAuthenticated, mustChangePassword, isResponsible,
 *  login, logout, updateResident), porém usa um admin fixo em memória.
 *
 * Motivo: o backend de autenticação (Sprint 5) ainda não existe. Assim as
 * páginas funcionam normalmente durante as Sprints 8 e 9.
 *
 * Quando a Sprint 5 for implementada, troque APENAS o corpo de login() por
 * uma chamada real (apiLogin) — nenhuma página precisa mudar.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

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
  isResponsible: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  updateResident: (patch: Partial<AuthResident>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── MOCK: admin fixo (substituir quando a Sprint 5 existir) ──────────────────
const MOCK_ADMIN: AuthResident = {
  id: 'mock-admin-id',
  nickname: 'admin',
  fullName: 'Administrador (mock)',
  phone: null,
  category: undefined,
  role: 'admin',
  isActive: true,
  mustChangePassword: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Já entra "logado" como admin para destravar o desenvolvimento das telas
  const [resident, setResident] = useState<AuthResident | null>(MOCK_ADMIN);
  const [accessToken, setAccessToken] = useState<string | null>('mock-token');

  const login = useCallback(async (_identifier: string, _password: string) => {
    // TODO Sprint 5: const { accessToken, resident } = await apiLogin(_identifier, _password)
    setResident(MOCK_ADMIN);
    setAccessToken('mock-token');
  }, []);

  const logout = useCallback(() => {
    setResident(null);
    setAccessToken(null);
  }, []);

  const updateResident = useCallback((patch: Partial<AuthResident>) => {
    setResident((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        resident,
        accessToken,
        isAuthenticated: !!accessToken && !!resident,
        mustChangePassword: resident?.mustChangePassword ?? false,
        // admin é sempre tratado como responsável
        isResponsible: resident?.role === 'admin',
        login,
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
