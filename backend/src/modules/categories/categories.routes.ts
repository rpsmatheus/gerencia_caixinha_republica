import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { ExpenseCategory } from '../../models/Expense.js';

export const categoryRoutes: Router = Router();

categoryRoutes.get('/', asyncHandler(async (req, res) => {
  const categories = Object.values(ExpenseCategory);
  res.json({ success: true, data: categories });
}));

categoryRoutes.post('/', asyncHandler(async (req, res) => {
  const { name } = req.body;
  res.status(201).json({ success: true, data: { name }, message: "Categoria criada com sucesso" });
}));

categoryRoutes.delete('/:id', asyncHandler(async (req, res) => {
  res.json({ success: true, message: "Categoria removida com sucesso" });
}));