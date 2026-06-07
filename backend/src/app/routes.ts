import { Router } from 'express';
import { residentRoutes } from '../modules/residents/residents.routes.js';
import { expenseRoutes } from '../modules/expenses/expenses.routes.js';
import { categoryRoutes } from '../modules/categories/categories.routes.js';
import { budgetRoutes } from '../modules/budgets/budgets.routes.js';

const router: Router = Router();

// 📌 Residents
router.use('/residents', residentRoutes);

// 📌 Expenses
router.use('/expenses', expenseRoutes);

// 📌 Categories
router.use('/categories', categoryRoutes);

// 📌 Budgets
router.use('/budgets', budgetRoutes);

export default router;