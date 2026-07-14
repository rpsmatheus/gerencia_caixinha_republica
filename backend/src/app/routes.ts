import { Router } from 'express';
import { paymentRoutes } from '../modules/payments/payments.routes.js';
import { residentRoutes } from '../modules/residents/residents.routes.js';
import { expenseRoutes } from '../modules/expenses/expenses.routes.js';
import { categoryRoutes } from '../modules/categories/categories.routes.js';
import { budgetRoutes } from '../modules/budgets/budgets.routes.js';
import { monthlyBalanceRoutes } from '../modules/monthly-balance/monthlyBalance.routes.js';
import { reportRoutes } from '../modules/reports/reports.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';

const router: Router = Router();

// 📌 Auth
router.use('/auth', authRoutes);

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

// 📌 Reports
router.use('/reports', reportRoutes);

export default router;