import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: useAuthMock,
}));

const { usePermissions } = await import('../../src/hooks/usePermissions');

describe('usePermissions', () => {
  it('nega tudo (exceto canViewOwnDataOnly) quando não há resident autenticado', () => {
    useAuthMock.mockReturnValue({ resident: null });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      canManageResidents: false,
      canManageExpenses: false,
      canManageBudgets: false,
      canManageCategories: false,
      canManagePayments: false,
      canViewAllResidents: false,
      canViewOwnDataOnly: true,
    });
  });

  it('concede todas as permissões de gestão para admin', () => {
    useAuthMock.mockReturnValue({ resident: { role: 'admin' } });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      canManageResidents: true,
      canManageExpenses: true,
      canManageBudgets: true,
      canManageCategories: true,
      canManagePayments: true,
      canViewAllResidents: true,
      canViewOwnDataOnly: false,
    });
  });

  it('restringe um resident comum a apenas visualizar os próprios dados', () => {
    useAuthMock.mockReturnValue({ resident: { role: 'resident' } });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      canManageResidents: false,
      canManageExpenses: false,
      canManageBudgets: false,
      canManageCategories: false,
      canManagePayments: false,
      canViewAllResidents: false,
      canViewOwnDataOnly: true,
    });
  });
});
