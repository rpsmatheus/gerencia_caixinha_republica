import { IExpense } from '../../models/Expense.js';

/**
 * Divide o total das despesas COMUNS entre os moradores ativos.
 * Despesas extras (isExtra=true) NÃO entram nesta divisão.
 */
export function calculateMonthlyShare(
    expenses: IExpense[],
    activeResidentCount: number
): number {
    if (activeResidentCount <= 0) return 0;
    const commonTotal = expenses
        .filter(e => !e.isExtra)
        .reduce((sum, e) => sum + e.amount, 0);
    return commonTotal / activeResidentCount;
}

/**
 * Calcula o saldo atual de um morador no mês.
 * currentBalance = previousBalance + monthlyShare - amountPaid
 */
export function calculateCurrentBalance(
    previousBalance: number,
    monthlyShare: number,
    amountPaid: number
): number {
    return previousBalance + monthlyShare - amountPaid;
}

/**
 * Retorna o monthKey no formato 'YYYY-MM' a partir de year e month.
 */
export function toMonthKey(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
}
