import { Router } from 'express';
import { paymentRoutes } from '../modules/payments/payments.routes.js';
import { residentRoutes } from '../modules/residents/residents.routes.js';
import { expenseRoutes } from '../modules/expenses/expenses.routes.js';
import { categoryRoutes } from '../modules/categories/categories.routes.js';
import { budgetRoutes } from '../modules/budgets/budgets.routes.js';
import { monthlyBalanceRoutes } from '../modules/monthly-balance/monthlyBalance.routes.js';

const router: Router = Router();

// 📌 Residents
router.use('/residents', residentRoutes);

// 📌 Expenses
router.use('/expenses', expenseRoutes);

// 📌 Categories
router.use('/categories', categoryRoutes);

// 📌 Budgets
router.use('/budgets', budgetRoutes);

// 📌 Payments
router.use('/payments', paymentRoutes);

// 📌 Monthly Balance
router.use('/monthly-balance', monthlyBalanceRoutes);

export default router;