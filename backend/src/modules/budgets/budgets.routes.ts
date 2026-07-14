import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { budgetRepo, budgetTemplateRepo, expenseRepo, residentRepo } from '../../app/appContext.js';
import { ExpenseFactory } from '../../factories/ExpenseFactory.js';
import { IBudget } from '../../models/Budget.js';

export const budgetRoutes: Router = Router();

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
 * GET /api/budgets/templates
 * Modelos de gastos padrão configuráveis, usados por "Simular Mês Padrão".
 */
budgetRoutes.get(
    '/templates',
    authMiddleware,
    authorize('admin', 'resident'),
    asyncHandler(async (req, res) => {
        const templates = await budgetTemplateRepo.findAllByRepublic(req.user!.republicId);
        res.json({ success: true, data: templates });
    })
);

/**
 * POST /api/budgets/templates
 */
budgetRoutes.post(
    '/templates',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const { description, category, amount } = req.body;
        if (!description?.trim()) return res.status(400).json({ error: 'description é obrigatório' });
        if (!category?.trim()) return res.status(400).json({ error: 'category é obrigatório' });
        if (!amount || amount <= 0) return res.status(400).json({ error: 'amount inválido' });

        const template = await budgetTemplateRepo.create({
            republicId: req.user!.republicId,
            description: description.trim(),
            category,
            amount,
        });
        res.status(201).json({ success: true, data: template });
    })
);

/**
 * DELETE /api/budgets/templates/:id
 */
budgetRoutes.delete(
    '/templates/:id',
    authMiddleware,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        await budgetTemplateRepo.delete(req.params.id, req.user!.republicId);
        res.json({ success: true, message: 'Modelo removido com sucesso' });
    })
);

/**
 * GET /api/budgets/:year/:month
 * Orçamentos planejados do mês.
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

        const [budgets, residentsResult] = await Promise.all([
            budgetRepo.findByMonth(user.republicId, year, month),
            residentRepo.findAll({ republicId: user.republicId }, 1, 1000),
        ]);

        const budgetsTotal = budgets.reduce((sum, b) => sum + b.amount, 0);
        const activeResidents = residentsResult.data.filter((r) => r.isActive).length;
        const perPersonDivision = activeResidents > 0 ? budgetsTotal / activeResidents : 0;

        res.json({
            success: true,
            data: {
                budgets: budgets.map((b) => toBudgetDTO(b)),
                budgetsTotal,
                activeResidents,
                perPersonDivision,
            },
        });
    })
);

/**
 * POST /api/budgets/simulate/:year/:month
 * Instancia os modelos de gasto configurados (água, luz, internet...) como
 * orçamento planejado deste mês — idempotente por descrição.
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

        const templates = await budgetTemplateRepo.findAllByRepublic(user.republicId);

        const created = [];
        for (const template of templates) {
            const already = await budgetRepo.findByDescriptionForMonth(user.republicId, year, month, template.description);
            if (already) continue;
            const budget = await budgetRepo.create({
                republicId: user.republicId,
                year,
                month,
                description: template.description,
                category: template.category,
                amount: template.amount,
            });
            created.push(budget);
        }

        const budgets = await budgetRepo.findByMonth(user.republicId, year, month);
        res.status(201).json({
            success: true,
            data: budgets.map((b) => toBudgetDTO(b)),
            message: created.length > 0
                ? `${created.length} orçamento(s) simulado(s) a partir dos modelos configurados`
                : 'Nenhum modelo novo para simular — configure modelos em "Modelos" ou já foram simulados este mês',
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
