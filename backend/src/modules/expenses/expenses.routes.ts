import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { expenseRepo } from '../../app/appContext.js';
import { ExpenseFactory } from '../../factories/ExpenseFactory.js';

import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export const expenseRoutes: Router = Router();

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
      isExtra: req.query.isExtra
        ? req.query.isExtra === 'true'
        : undefined,
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
      data,
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
    const expense = await expenseRepo.findById(req.params.id,user);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Despesa não encontrada',
      });
    }

    res.json({
      success: true,
      data: expense,
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
    const expense = ExpenseFactory.create(req.body,user);

    const saved = await expenseRepo.save(expense);

    res.status(201).json({
      success: true,
      data: saved,
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
    const updated = await expenseRepo.update(req.params.id, req.body,user);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Despesa não encontrada',
      });
    }

    res.json({
      success: true,
      data: updated,
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
    await expenseRepo.delete(req.params.id,user);

    res.json({
      success: true,
      message: 'Despesa removida com sucesso',
    });
  })
);