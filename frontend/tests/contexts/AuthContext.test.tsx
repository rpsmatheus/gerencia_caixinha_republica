import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

const { apiLoginMock, apiLogoutMock, apiMeMock, apiRegisterMock } = vi.hoisted(() => ({
  apiLoginMock: vi.fn(),
  apiLogoutMock: vi.fn(),
  apiMeMock: vi.fn(),
  apiRegisterMock: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  apiLogin: apiLoginMock,
  apiLogout: apiLogoutMock,
  apiMe: apiMeMock,
  apiRegister: apiRegisterMock,
}));

const { AuthProvider, useAuth } = await import('../../src/contexts/AuthContext');

const TOKEN_KEY = 'caixinha_token';
const RESIDENT_KEY = 'caixinha_resident';

const RESIDENT = {
  id: 'r1',
  nickname: 'fulano',
  fullName: 'Fulano de Tal',
  role: 'resident' as const,
  isActive: true,
  mustChangePassword: false,
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AuthProvider', () => {
  it('inicia deslogado quando não há token salvo', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.resident).toBeNull();
    expect(apiMeMock).not.toHaveBeenCalled();
  });

  it('restaura a sessão validando o token salvo contra o backend', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-salvo');
    apiMeMock.mockResolvedValue(RESIDENT);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiMeMock).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.resident).toEqual(RESIDENT);
    expect(JSON.parse(localStorage.getItem(RESIDENT_KEY)!)).toEqual(RESIDENT);
  });

  it('limpa a sessão quando o token salvo é rejeitado pelo backend', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-invalido');
    apiMeMock.mockRejectedValue(new Error('401'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('login persiste o token e o resident retornados pela API', async () => {
    apiLoginMock.mockResolvedValue({ accessToken: 'novo-token', resident: RESIDENT });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('fulano', 'senha123');
    });

    expect(apiLoginMock).toHaveBeenCalledWith('fulano', 'senha123');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.resident).toEqual(RESIDENT);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('novo-token');
  });

  it('logout limpa a sessão e avisa o backend', async () => {
    apiLoginMock.mockResolvedValue({ accessToken: 'novo-token', resident: RESIDENT });
    apiLogoutMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login('fulano', 'senha123');
    });

    act(() => {
      result.current.logout();
    });

    expect(apiLogoutMock).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.resident).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('updateResident faz merge parcial e persiste no localStorage', async () => {
    apiLoginMock.mockResolvedValue({ accessToken: 'novo-token', resident: RESIDENT });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login('fulano', 'senha123');
    });

    act(() => {
      result.current.updateResident({ fullName: 'Nome Atualizado' });
    });

    expect(result.current.resident?.fullName).toBe('Nome Atualizado');
    expect(result.current.resident?.nickname).toBe('fulano');
    expect(JSON.parse(localStorage.getItem(RESIDENT_KEY)!).fullName).toBe('Nome Atualizado');
  });
});
