import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { v4 as uuidv4 } from 'uuid';

export const budgetRoutes = Router();

// Simulação e listagem de orçamentos filtrados pela República e pelo Mês
budgetRoutes.get('/:republicaId/:year/:month', asyncHandler(async (req, res) => {
  const { republicaId, year, month } = req.params;
  const monthKey = `${year}-${month.padStart(2, '0')}`;

  // Aqui simularia a busca no banco filtrando por republicaId e monthKey
  res.json({
    success: true,
    data: {
      republicaId,
      month: monthKey,
      budgetsTotal: 4434.00, // Valor total simulado dos limites
      activeResidents: 13,
      perPersonDivision: 341.08,
      budgets: [] // Lista de orçamentos vinculados
    }
  });
}));

// POST /api/budgets - Criar ou definir um limite de gasto associado à república
budgetRoutes.post('/', asyncHandler(async (req, res) => {
  const { republicaId, description, amount, category, month } = req.body;
  
  if (!republicaId || !description || !amount) {
    return res.status(400).json({ error: 'República, descrição e valor limite são obrigatórios' });
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