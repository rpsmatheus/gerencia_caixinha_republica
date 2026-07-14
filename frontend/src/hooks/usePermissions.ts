/**
 * Hook de permissões baseado no papel do usuário.
 *
 * - Admin: acesso total
 * - Morador comum: apenas visualização dos próprios dados
 */

import { useAuth } from '../contexts/AuthContext';

interface UsePermissionsResult {
  /** Pode criar/editar/excluir moradores */
  canManageResidents: boolean;
  /** Pode criar/editar/excluir despesas */
  canManageExpenses: boolean;
  /** Pode criar/editar/excluir orçamentos */
  canManageBudgets: boolean;
  /** Pode criar/excluir categorias */
  canManageCategories: boolean;
  /** Pode registrar/excluir pagamentos no mês */
  canManagePayments: boolean;
  /** Pode ver a lista de todos os moradores */
  canViewAllResidents: boolean;
  /** Usuário só pode ver seus próprios dados */
  canViewOwnDataOnly: boolean;
}

export function usePermissions(_monthKey?: string): UsePermissionsResult {
  const { resident } = useAuth();

  if (!resident) {
    return {
      canManageResidents: false,
      canManageExpenses: false,
      canManageBudgets: false,
      canManageCategories: false,
      canManagePayments: false,
      canViewAllResidents: false,
      canViewOwnDataOnly: true,
    };
  }

  const isAdmin = resident.role === 'admin';

  return {
    canManageResidents: isAdmin,
    canManageExpenses: isAdmin,
    canManageBudgets: isAdmin,
    canManageCategories: isAdmin,
    canManagePayments: isAdmin,
    canViewAllResidents: isAdmin,
    canViewOwnDataOnly: !isAdmin,
  };
}
