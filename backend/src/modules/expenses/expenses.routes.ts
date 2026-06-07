import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { expenseRepo } from '../../app/appContext.js';
import { ExpenseFactory } from '../../factories/ExpenseFactory.js';

export const expenseRoutes = Router();

/**
 * 📌 GET /api/expenses
 * Lista despesas (paginado)
 */
expenseRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, total } = await expenseRepo.findAll(page, limit);

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
 * Buscar despesa por ID
 */
expenseRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await expenseRepo.findById(req.params.id);

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
 * Criar despesa
 */
expenseRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    const expense = ExpenseFactory.create(req.body);

    const saved = await expenseRepo.save(expense);

    res.status(201).json({
      success: true,
      data: saved,
    });
  })
);

/**
 * 📌 PUT /api/expenses/:id
 * Atualizar despesa
 */
expenseRoutes.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await expenseRepo.update(req.params.id, req.body);

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
 * Remover despesa
 */
expenseRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await expenseRepo.delete(req.params.id);

    res.json({
      success: true,
      message: 'Despesa removida com sucesso',
    });
  })
);