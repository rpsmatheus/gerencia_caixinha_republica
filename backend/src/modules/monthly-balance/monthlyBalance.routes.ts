import { Router } from 'express';
import { PaymentFactory } from '../../factories/PaymentFactory.js';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { monthlyBalanceRepo, expenseRepo, residentRepo, paymentRepo } from '../../app/appContext.js';
import { calculateMonthlyShare, calculateCurrentBalance, toMonthKey } from './monthlyBalance.utils.js';

export const monthlyBalanceRoutes: Router = Router();
const SYSTEM_USER = { id: 'system', role: 'admin', republicId: '' };
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
        residentRepo.findAll(SYSTEM_USER, 1, 1000),
        expenseRepo.findAll(SYSTEM_USER, 1, 10000, {
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

/**
 * GET /api/monthly-balance/:residentId?year=2026&month=6
 * Retorna o saldo de UM morador específico no mês.
 */
monthlyBalanceRoutes.get('/:residentId', asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year as string);
    const month = parseInt(req.query.month as string);
    const { residentId } = req.params;

    if (!year || !month) {
        return res.status(400).json({ error: 'year e month obrigatórios' });
    }

    const balance = await monthlyBalanceRepo.findByResidentAndMonth(residentId, year, month);
    if (!balance) {
        return res.status(404).json({ error: 'Saldo não encontrado para este morador/mês' });
    }
    res.json({ success: true, data: balance });
}));

/**
 * POST /api/monthly-balance/:residentId/payment
 * Registra um pagamento diretamente pelo fechamento e recalcula o saldo.
 * Corpo: { year, month, amount, proofUrl? }
 */
monthlyBalanceRoutes.post('/:residentId/payment', asyncHandler(async (req, res) => {
    const { residentId } = req.params;
    const { year, month, amount, proofUrl } = req.body;

    if (!year || !month || !amount || amount <= 0) {
        return res.status(400).json({ error: 'year, month e amount obrigatórios' });
    }

    const monthKey = toMonthKey(year, month);

    // Criar o pagamento
    const payment = PaymentFactory.create({ residentId, month: monthKey, amount, proofUrl });
    await paymentRepo.save(payment);

    // Buscar saldo atual e recalcular
    const current = await monthlyBalanceRepo.findByResidentAndMonth(residentId, year, month);
    const newAmountPaid = (current?.amountPaid ?? 0) + amount;
    const newCurrentBalance = (current?.totalDue ?? 0) - newAmountPaid;

    const updated = await monthlyBalanceRepo.upsert({
        residentId, year, month,
        previousBalance: current?.previousBalance ?? 0,
        monthlyShare: current?.monthlyShare ?? 0,
        totalDue: current?.totalDue ?? 0,
        amountPaid: newAmountPaid,
        currentBalance: newCurrentBalance,
        paymentProofUrl: proofUrl,
        paymentDate: new Date(),
    });

    res.status(201).json({ success: true, data: { payment, balance: updated } });
}));