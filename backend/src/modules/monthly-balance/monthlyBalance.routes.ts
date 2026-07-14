import { Router } from 'express';
import { PaymentFactory } from '../../factories/PaymentFactory.js';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { monthlyBalanceRepo, expenseRepo, residentRepo, paymentRepo } from '../../app/appContext.js';
import {
    calculateMonthlyShare,
    toMonthKey,
    daysInMonth,
    computeProportionalFactor,
} from './monthlyBalance.utils.js';

export const monthlyBalanceRoutes: Router = Router();

function monthRange(year: number, month: number) {
    return {
        startDate: new Date(year, month - 1, 1),
        endDate: new Date(year, month, 0, 23, 59, 59, 999),
    };
}

function parseYearMonth(req: any): { year: number; month: number } | null {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    if (!year || !month || month < 1 || month > 12) return null;
    return { year, month };
}

/**
 * GET /api/monthly-balance/:year/:month
 * Painel completo do mês: saldo de cada morador, despesas do mês e a cota
 * por pessoa. Recalcula a cada chamada.
 */
monthlyBalanceRoutes.get(
    '/:year/:month',
    authMiddleware,
    authorize('admin', 'resident'),
    asyncHandler(async (req, res) => {
        const parsed = parseYearMonth(req);
        if (!parsed) return res.status(400).json({ error: 'year e month inválidos' });
        const { year, month } = parsed;
        const user = req.user!;

        const monthKey = toMonthKey(year, month);
        const totalDays = daysInMonth(year, month);
        const { startDate, endDate } = monthRange(year, month);

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        const [residentsResult, expensesResult, existingBalances] = await Promise.all([
            residentRepo.findAll({ republicId: user.republicId }, 1, 1000),
            expenseRepo.findAll(user, 1, 10000, { startDate, endDate }),
            monthlyBalanceRepo.findByMonth(year, month),
        ]);

        const overrideByResident = new Map(existingBalances.map((b) => [b.residentId, b]));

        const monthResidents = residentsResult.data.map((resident) => {
            const residentId = String(resident._id);
            const override = overrideByResident.get(residentId);
            const isActive = override?.isActive ?? true;
            const exitDay = override?.exitDay ?? null;
            const proportionalFactor = computeProportionalFactor(exitDay, totalDays);
            return { resident, residentId, isActive, exitDay, proportionalFactor };
        });

        const activeThisMonth = monthResidents.filter((m) => m.isActive);
        // Peso proporcional total: quem saiu no meio do mês entra como uma "fração de
        // pessoa" na divisão, então a diferença que ele deixa de pagar é redistribuída
        // entre os demais ativos — a soma das cotas sempre fecha com o total do mês.
        const totalProportionalWeight = activeThisMonth.reduce((sum, m) => sum + m.proportionalFactor, 0);
        const monthlyShare = calculateMonthlyShare(expensesResult.data, totalProportionalWeight);

        const balances = await Promise.all(
            monthResidents.map(async ({ resident, residentId, isActive, exitDay, proportionalFactor }) => {
                const prevBalanceDoc = await monthlyBalanceRepo.findByResidentAndMonth(residentId, prevYear, prevMonth);
                const previousBalance = prevBalanceDoc?.currentBalance ?? 0;

                const currentMonthDue = isActive ? monthlyShare * proportionalFactor : 0;
                const totalDue = previousBalance + currentMonthDue;

                const payments = await paymentRepo.findByResidentAndMonth(residentId, monthKey);
                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                const remainingBalance = totalDue - totalPaid;

                await monthlyBalanceRepo.upsert({
                    residentId,
                    year,
                    month,
                    previousBalance,
                    monthlyShare: currentMonthDue,
                    totalDue,
                    amountPaid: totalPaid,
                    currentBalance: remainingBalance,
                    isActive,
                    exitDay,
                    proportionalFactor,
                });

                return {
                    residentId,
                    residentName: resident.fullName,
                    nickname: resident.nickname,
                    isActive,
                    exitDay,
                    proportionalFactor,
                    payments: payments.map((p) => ({
                        id: p.id,
                        residentId: p.residentId,
                        month: p.month,
                        amount: p.amount,
                        proofUrl: p.proofUrl ?? null,
                        createdAt: p.createdAt,
                    })),
                    totalPaid,
                    previousBalance,
                    currentMonthDue,
                    totalDue,
                    remainingBalance,
                };
            })
        );

        const totalExpenses = expensesResult.data.reduce((sum, e) => sum + e.amount, 0);

        res.json({
            success: true,
            data: {
                month: monthKey,
                totalExpenses,
                activeResidents: activeThisMonth.length,
                perPersonAmount: monthlyShare,
                balances,
                expenses: expensesResult.data.map((e) => ({
                    id: String(e._id),
                    description: e.description,
                    category: e.category,
                    expenseDate: e.expenseDate,
                    amount: e.amount,
                })),
                // Módulo de responsáveis mensais ainda não existe no backend
                manager: null,
            },
        });
    })
);

/**
 * PUT /api/monthly-balance/:year/:month/:residentId/status
 * Ativa/desativa um morador especificamente neste mês (não afeta a conta global).
 */
monthlyBalanceRoutes.put(
    '/:year/:month/:residentId/status',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const parsed = parseYearMonth(req);
        if (!parsed) return res.status(400).json({ error: 'year e month inválidos' });
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive (boolean) obrigatório' });
        }

        const updated = await monthlyBalanceRepo.upsert({
            residentId: req.params.residentId,
            year: parsed.year,
            month: parsed.month,
            isActive,
        });

        res.json({ success: true, data: updated });
    })
);

/**
 * PUT /api/monthly-balance/:year/:month/:residentId/proportional
 * Define o dia de saída do morador no mês, recalculando o fator proporcional.
 */
monthlyBalanceRoutes.put(
    '/:year/:month/:residentId/proportional',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const parsed = parseYearMonth(req);
        if (!parsed) return res.status(400).json({ error: 'year e month inválidos' });
        const { exitDay } = req.body;
        if (!exitDay || exitDay < 1 || exitDay > 31) {
            return res.status(400).json({ error: 'exitDay deve estar entre 1 e 31' });
        }

        const totalDays = daysInMonth(parsed.year, parsed.month);
        const proportionalFactor = computeProportionalFactor(exitDay, totalDays);

        const updated = await monthlyBalanceRepo.upsert({
            residentId: req.params.residentId,
            year: parsed.year,
            month: parsed.month,
            exitDay,
            proportionalFactor,
        });

        res.json({ success: true, data: updated });
    })
);

/**
 * DELETE /api/monthly-balance/:year/:month/:residentId/proportional
 * Remove o cálculo proporcional — morador volta a contar o mês inteiro.
 */
monthlyBalanceRoutes.delete(
    '/:year/:month/:residentId/proportional',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const parsed = parseYearMonth(req);
        if (!parsed) return res.status(400).json({ error: 'year e month inválidos' });

        const updated = await monthlyBalanceRepo.upsert({
            residentId: req.params.residentId,
            year: parsed.year,
            month: parsed.month,
            exitDay: null,
            proportionalFactor: 1,
        });

        res.json({ success: true, data: updated });
    })
);

/**
 * POST /api/monthly-balance/:year/:month/:residentId/payment
 * Registra um pagamento do morador para o mês.
 */
monthlyBalanceRoutes.post(
    '/:year/:month/:residentId/payment',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const parsed = parseYearMonth(req);
        if (!parsed) return res.status(400).json({ error: 'year e month inválidos' });
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'amount inválido' });
        }

        const monthKey = toMonthKey(parsed.year, parsed.month);
        const payment = PaymentFactory.create({ residentId: req.params.residentId, month: monthKey, amount });
        const saved = await paymentRepo.save(payment);

        res.status(201).json({ success: true, data: saved });
    })
);

/**
 * DELETE /api/monthly-balance/payment/:paymentId
 * Remove um lançamento de pagamento específico.
 */
monthlyBalanceRoutes.delete(
    '/payment/:paymentId',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        await paymentRepo.delete(req.params.paymentId);
        res.json({ success: true });
    })
);
