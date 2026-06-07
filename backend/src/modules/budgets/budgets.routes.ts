import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { v4 as uuidv4 } from 'uuid';

export const budgetRoutes: Router = Router();

budgetRoutes.get('/:republicaId/:year/:month', asyncHandler(async (req, res) => {
  const { republicaId, year, month } = req.params;
  const monthKey = `${year}-${month.padStart(2, '0')}`;
  res.json({
    success: true,
    data: {
      republicaId,
      month: monthKey,
      budgetsTotal: 4434.00,
      activeResidents: 13,
      perPersonDivision: 341.08,
      budgets: []
    }
  });
}));

budgetRoutes.post('/', asyncHandler(async (req, res) => {
  const { republicaId, description, amount, category, month } = req.body;
  if (!republicaId || !description || !amount) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }
  const newBudget = {
    id: uuidv4(),
    republicaId,
    description,
    amount: parseFloat(amount),
    category,
    month,
    isApplied: false,
    createdAt: new Date()
  };
  res.status(201).json({ success: true, data: newBudget });
}));