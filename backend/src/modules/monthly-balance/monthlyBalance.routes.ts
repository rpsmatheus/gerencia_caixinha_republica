import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { monthlyBalanceRepo, expenseRepo, residentRepo, paymentRepo } from '../../app/appContext.js';
import { calculateMonthlyShare, calculateCurrentBalance, toMonthKey } from './monthlyBalance.utils.js';

export const monthlyBalanceRoutes = Router();

/**
 * GET /api/monthly-balance?year=2026&month=6
 * Retorna o saldo calculado de TODOS os moradores ativos no mês.
 * Calcula em tempo real: busca despesas + pagamentos e monta o balanço.
 */
monthlyBalanceRoutes.get('/', asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year as string);
    const month = parseInt(req.query.month as string);

    if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Parâmetros year e month obrigatórios' });
    }

    const monthKey = toMonthKey(year, month);

    // Buscar dados necessários em paralelo
    const [residentsResult, expenses] = await Promise.all([
        residentRepo.findAll(1, 1000),
        expenseRepo.findAll(1, 10000, {
            startDate: new Date(`${monthKey}-01`),
            endDate: new Date(`${monthKey}-31`),
        }),
    ]);

    const activeResidents = residentsResult.data.filter(r => r.isActive);
    const monthlyShare = calculateMonthlyShare(expenses.data, activeResidents.length);

    // Montar saldo de cada morador
    const balances = await Promise.all(
        activeResidents.map(async (resident) => {
            const residentId = String(resident._id);

            // Buscar saldo anterior (mês passado)
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            const prevBalance = await monthlyBalanceRepo.findByResidentAndMonth(
                residentId, prevYear, prevMonth
            );
            const previousBalance = prevBalance?.currentBalance ?? 0;

            // Pagamentos já feitos no mês
            const payments = await paymentRepo.findByResidentAndMonth(residentId, monthKey);
            const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

            const totalDue = previousBalance + monthlyShare;
            const currentBalance = calculateCurrentBalance(previousBalance, monthlyShare, amountPaid);

            // Persistir/atualizar o saldo calculado
            await monthlyBalanceRepo.upsert({
                residentId, year, month,
                previousBalance, monthlyShare, totalDue, amountPaid, currentBalance,
            });

            return {
                residentId, residentName: resident.fullName,
                previousBalance, monthlyShare, totalDue, amountPaid, currentBalance,
                isPaid: currentBalance <= 0,
            };
        })
    );

    res.json({
        success: true,
        data: {
            year, month, monthKey,
            monthlyShare,
            activeResidentCount: activeResidents.length,
            balances,
        },
    });
}));