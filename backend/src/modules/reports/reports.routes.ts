import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { expenseRepo, monthlyBalanceRepo, residentRepo } from '../../app/appContext.js';
import { toMonthKey } from '../monthly-balance/monthlyBalance.utils.js';

export const reportRoutes: Router = Router();
const SYSTEM_USER = { id: 'system', role: 'admin', republicId: '' };
/**
 * GET /api/reports/monthly?year=2026&month=6
 * Relatório consolidado do mês: despesas + saldos de moradores.
 */
reportRoutes.get('/monthly', asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year as string);
    const month = parseInt(req.query.month as string);

    if (!year || !month) {
        return res.status(400).json({ error: 'year e month obrigatórios' });
    }

    const monthKey = toMonthKey(year, month);

    // Buscar dados em paralelo
    const [expenseResult, balances, residentsResult] = await Promise.all([
        expenseRepo.findAll(SYSTEM_USER, 1, 10000, {
            startDate: new Date(`${monthKey}-01`),
            endDate: new Date(`${monthKey}-31`),
        }),
        monthlyBalanceRepo.findByMonth(year, month),
        residentRepo.findAll(SYSTEM_USER, 1, 1000),
    ]);

    const expenses = expenseResult.data;
    const activeResidents = residentsResult.data.filter(r => r.isActive);

    // Totais de despesas
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Despesas por categoria
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
        byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }

    // Totais de saldos
    const totalCollected = balances.reduce((s, b) => s + b.amountPaid, 0);
    const totalPending = balances.reduce((s, b) => s + Math.max(0, b.currentBalance), 0);
    const paidCount = balances.filter(b => b.currentBalance <= 0).length;
    const pendingCount = balances.filter(b => b.currentBalance > 0).length;
    const adimplencyRate = activeResidents.length > 0
        ? (paidCount / activeResidents.length) * 100 : 0;

    res.json({
        success: true,
        data: {
            year, month, monthKey,
            expenses: {
                total: totalExpenses,
                count: expenses.length, byCategory,
            },
            balances: {
                totalCollected, totalPending,
                paidCount, pendingCount,
                adimplencyRate: Math.round(adimplencyRate * 10) / 10,
                perResident: balances,
            },
            activeResidentCount: activeResidents.length,
            generatedAt: new Date(),
        },
    });
}));