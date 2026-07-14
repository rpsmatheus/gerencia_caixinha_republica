import { IExpense } from '../../models/Expense.js';

/**
 * Divide o total das despesas do mês entre os moradores ativos.
 */
export function calculateMonthlyShare(
    expenses: IExpense[],
    activeResidentCount: number
): number {
    if (activeResidentCount <= 0) return 0;
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return total / activeResidentCount;
}

/**
 * Retorna o monthKey no formato 'YYYY-MM' a partir de year e month.
 */
export function toMonthKey(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Quantidade de dias no mês (considera anos bissextos).
 */
export function daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

/**
 * Fator proporcional da cota de um morador com saída no meio do mês.
 * exitDay nulo/indefinido = mês inteiro (fator 1).
 */
export function computeProportionalFactor(
    exitDay: number | null | undefined,
    totalDaysInMonth: number
): number {
    if (!exitDay || exitDay <= 0) return 1;
    return Math.min(exitDay, totalDaysInMonth) / totalDaysInMonth;
}
