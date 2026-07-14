import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { budgetRepo, expenseRepo, residentRepo } from '../../app/appContext.js';
import { ExpenseFactory } from '../../factories/ExpenseFactory.js';
import { IBudget } from '../../models/Budget.js';

export const budgetRoutes: Router = Router();

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

function toBudgetDTO(budget: IBudget | null) {
    if (!budget) return null;
    return {
        id: budget.id,
        month: `${budget.year}-${String(budget.month).padStart(2, '0')}`,
        description: budget.description,
        amount: budget.amount,
        category: budget.category,
        isApplied: budget.isApplied,
    };
}

/**
 * GET /api/budgets/:year/:month
 * Orçamentos planejados do mês + extras cobrados do mês anterior.
 */
budgetRoutes.get(
    '/:year/:month',
    authMiddleware,
    authorize('admin', 'resident'),
    asyncHandler(async (req, res) => {
        const parsed = parseYearMonth(req);
        if (!parsed) return res.status(400).json({ error: 'year e month inválidos' });
        const { year, month } = parsed;
        const user = req.user!;

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevRange = monthRange(prevYear, prevMonth);

        const [budgets, extrasResult, residentsResult] = await Promise.all([
            budgetRepo.findByMonth(user.republicId, year, month),
            expenseRepo.findAll(user, 1, 10000, { startDate: prevRange.startDate, endDate: prevRange.endDate, isExtra: true }),
            residentRepo.findAll({ republicId: user.republicId }, 1, 1000),
        ]);

        const budgetsTotal = budgets.reduce((sum, b) => sum + b.amount, 0);
        const extrasTotal = extrasResult.data.reduce((sum, e) => sum + e.amount, 0);
        const totalWithExtras = budgetsTotal + extrasTotal;
        const activeResidents = residentsResult.data.filter((r) => r.isActive).length;
        const perPersonDivision = activeResidents > 0 ? totalWithExtras / activeResidents : 0;

        res.json({
            success: true,
            data: {
                budgets: budgets.map((b) => toBudgetDTO(b)),
                extras: extrasResult.data.map((e) => ({
                    id: String(e._id),
                    description: e.description,
                    amount: e.amount,
                    category: e.category,
                    expenseDate: e.expenseDate,
                })),
                extrasTotal,
                budgetsTotal,
                totalWithExtras,
                activeResidents,
                perPersonDivision,
            },
        });
    })
);

/**
 * POST /api/budgets/simulate/:year/:month
 * Copia as despesas comuns (não-extras) do mês anterior como orçamento
 * planejado deste mês — um ponto de partida "mesmo do mês passado".
 */
budgetRoutes.post(
    '/simulate/:year/:month',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const parsed = parseYearMonth(req);
        if (!parsed) return res.status(400).json({ error: 'year e month inválidos' });
        const { year, month } = parsed;
        const user = req.user!;

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevRange = monthRange(prevYear, prevMonth);

        const prevExpenses = await expenseRepo.findAll(user, 1, 10000, {
            startDate: prevRange.startDate,
            endDate: prevRange.endDate,
            isExtra: false,
        });

        const created = [];
        for (const expense of prevExpenses.data) {
            const already = await budgetRepo.findByDescriptionForMonth(user.republicId, year, month, expense.description);
            if (already) continue;
            const budget = await budgetRepo.create({
                republicId: user.republicId,
                year,
                month,
                description: expense.description,
                category: expense.category,
                amount: expense.amount,
            });
            created.push(budget);
        }

        const budgets = await budgetRepo.findByMonth(user.republicId, year, month);
        res.status(201).json({
            success: true,
            data: budgets.map((b) => toBudgetDTO(b)),
            message: created.length > 0
                ? `${created.length} orçamento(s) simulado(s) a partir do mês anterior`
                : 'Nenhuma despesa nova para simular — mês anterior sem despesas comuns ou já simulado',
        });
    })
);

/**
 * POST /api/budgets/:id/apply
 * Converte um orçamento planejado em uma despesa real.
 */
budgetRoutes.post(
    '/:id/apply',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const user = req.user!;
        const budget = await budgetRepo.findById(req.params.id, user.republicId);
        if (!budget) return res.status(404).json({ error: 'Orçamento não encontrado' });
        if (budget.isApplied) return res.status(409).json({ error: 'Orçamento já foi aplicado' });

        const expense = ExpenseFactory.create({
            description: budget.description,
            category: budget.category,
            amount: budget.amount,
            expenseDate: new Date(),
            isExtra: false,
        }, user);
        const savedExpense = await expenseRepo.save(expense);

        const updated = await budgetRepo.update(budget.id, user.republicId, {
            isApplied: true,
            appliedExpenseId: String(savedExpense._id),
        });

        res.json({ success: true, data: toBudgetDTO(updated) });
    })
);

/**
 * PUT /api/budgets/:id
 * Ajusta o valor planejado de um orçamento.
 */
budgetRoutes.put(
    '/:id',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const user = req.user!;
        const { amount } = req.body;
        if (amount === undefined || amount <= 0) {
            return res.status(400).json({ error: 'amount inválido' });
        }

        const existing = await budgetRepo.findById(req.params.id, user.republicId);
        if (!existing) return res.status(404).json({ error: 'Orçamento não encontrado' });

        const updated = await budgetRepo.update(req.params.id, user.republicId, { amount });
        res.json({ success: true, data: toBudgetDTO(updated) });
    })
);

/**
 * DELETE /api/budgets/:id
 */
budgetRoutes.delete(
    '/:id',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const user = req.user!;
        await budgetRepo.delete(req.params.id, user.republicId);
        res.json({ success: true, message: 'Orçamento removido com sucesso' });
    })
);
