import { IExpense } from '../../models/Expense.js';

/**
 * Divide o total das despesas do mês pelo peso proporcional total dos
 * moradores ativos (soma dos proportionalFactor, não a contagem de cabeças).
 * Assim, quem saiu no meio do mês paga proporcionalmente menos e a diferença
 * é redistribuída entre os demais — a soma de todas as cotas sempre fecha
 * com o total das despesas (a "caixinha geral").
 */
export function calculateMonthlyShare(
    expenses: IExpense[],
    totalProportionalWeight: number
): number {
    if (totalProportionalWeight <= 0) return 0;
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return total / totalProportionalWeight;
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
