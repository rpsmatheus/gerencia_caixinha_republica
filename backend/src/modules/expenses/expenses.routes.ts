import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { expenseRepo } from '../../app/appContext.js';
import { ExpenseFactory } from '../../factories/ExpenseFactory.js';
import { IExpense } from '../../models/Expense.js';

import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export const expenseRoutes: Router = Router();

function toExpenseDTO(expense: IExpense) {
  return {
    id: String(expense._id),
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    // <input type="date"> exige exatamente YYYY-MM-DD — ISO completo com hora
    // faz o navegador descartar o valor silenciosamente ao editar.
    expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
    notes: expense.notes ?? null,
    proofUrl: expense.proofUrl ?? null,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

/**
 * 📌 GET /api/expenses
 * Lista despesas (paginado + filtros)
 */
expenseRoutes.get(
  '/',
  authMiddleware,
  authorize('admin', 'resident'),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // 🧠 FILTROS
    const filters = {
      category: req.query.category as any,
      minAmount: req.query.minAmount
        ? Number(req.query.minAmount)
        : undefined,
      maxAmount: req.query.maxAmount
        ? Number(req.query.maxAmount)
        : undefined,
      search: req.query.search as string,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const { data, total } = await expenseRepo.findAll(
      user,
      page,
      limit,
      filters
    );

    res.json({
      success: true,
      data: data.map(toExpenseDTO),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * 📌 GET /api/expenses/:id
 */
expenseRoutes.get(
  '/:id',
  authMiddleware,
  authorize('admin', 'resident'),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const expense = await expenseRepo.findById(req.params.id, user);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Despesa não encontrada',
      });
    }

    res.json({
      success: true,
      data: toExpenseDTO(expense),
    });
  })
);

/**
 * 📌 POST /api/expenses
 */
expenseRoutes.post(
  '/',
  authMiddleware,
  authorize('admin', 'resident'),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const expense = ExpenseFactory.create(req.body, user);

    const saved = await expenseRepo.save(expense);

    res.status(201).json({
      success: true,
      data: toExpenseDTO(saved),
    });
  })
);

/**
 * 📌 PUT /api/expenses/:id
 */
expenseRoutes.put(
  '/:id',
  authMiddleware,
  authorize('admin', 'resident'),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { description, category, amount, expenseDate, notes, proofUrl } = req.body;

    const patch: Record<string, unknown> = {};
    if (description !== undefined) patch.description = description;
    if (category !== undefined) patch.category = category;
    if (amount !== undefined) patch.amount = amount;
    if (expenseDate !== undefined) patch.expenseDate = new Date(expenseDate);
    if (notes !== undefined) patch.notes = notes;
    if (proofUrl !== undefined) patch.proofUrl = proofUrl ? String(proofUrl).trim() : undefined;

    const updated = await expenseRepo.update(req.params.id, patch, user);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Despesa não encontrada',
      });
    }

    res.json({
      success: true,
      data: toExpenseDTO(updated),
    });
  })
);

/**
 * 📌 DELETE /api/expenses/:id
 */
expenseRoutes.delete(
  '/:id',
  authMiddleware,
  authorize('admin', 'resident'),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    await expenseRepo.delete(req.params.id, user);

    res.json({
      success: true,
      message: 'Despesa removida com sucesso',
    });
  })
);
