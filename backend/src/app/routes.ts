import { Router } from 'express';
import { residentRoutes } from '../modules/residents/residents.routes.js';
import { expenseRoutes } from '../modules/expenses/expenses.routes.js';

const router = Router();

// 📌 Moradores
router.use('/residents', residentRoutes);

// 📌 Despesas (NOVO)
router.use('/expenses', expenseRoutes);

export default router;