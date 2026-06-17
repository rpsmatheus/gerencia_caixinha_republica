/**
 * Hook de permissões baseado no papel do usuário e responsabilidade mensal.
 *
 * - Admin: acesso total
 * - Responsável do mês: pode gerenciar pagamentos e ver todos os moradores
 * - Morador comum: apenas visualização dos próprios dados
 */

import { useAuth } from '../contexts/AuthContext';
import { useMonthlyResponsibility } from './useMonthlyResponsibility';

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
  /** Pode atribuir/remover responsáveis mensais */
  canAssignMonthlyResponsibles: boolean;
  /** Pode ver a lista de todos os moradores */
  canViewAllResidents: boolean;
  /** Usuário só pode ver seus próprios dados */
  canViewOwnDataOnly: boolean;
  /** É responsável para o mês especificado */
  isResponsibleForMonth: boolean;
  /** Carregando verificação de responsabilidade */
  loading: boolean;
}

/**
 * @param monthKey - chave do mês no formato "YYYY-MM" (opcional; se omitido usa o mês atual)
 */
export function usePermissions(monthKey?: string): UsePermissionsResult {
  const { resident, isResponsible: isResponsibleForAnyPeriod } = useAuth();

  const currentMonthKey =
    monthKey ??
    (() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    })();

  const { isResponsible, loading } = useMonthlyResponsibility(currentMonthKey);

  if (!resident) {
    return {
      canManageResidents: false,
      canManageExpenses: false,
      canManageBudgets: false,
      canManageCategories: false,
      canManagePayments: false,
      canAssignMonthlyResponsibles: false,
      canViewAllResidents: false,
      canViewOwnDataOnly: true,
      isResponsibleForMonth: false,
      loading,
    };
  }

  const isAdmin = resident.role === 'admin';

  return {
    canManageResidents: isAdmin,
    canManageExpenses: isAdmin,
    canManageBudgets: isAdmin,
    canManageCategories: isAdmin,
    canManagePayments: isAdmin || isResponsible,
    canAssignMonthlyResponsibles: isAdmin,
    canViewAllResidents: isAdmin || isResponsibleForAnyPeriod,
    canViewOwnDataOnly: !isAdmin && !isResponsibleForAnyPeriod,
    isResponsibleForMonth: isAdmin || isResponsible,
    loading,
  };
}
