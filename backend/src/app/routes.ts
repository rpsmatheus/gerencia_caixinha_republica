import { Router } from 'express';
import { residentRoutes } from '../modules/residents/residents.routes.js';
import { categoryRoutes } from '../modules/categories/categories.routes.js';
import { budgetRoutes } from '../modules/budgets/budgets.routes.js'; 

const router = Router();

router.use('/residents', residentRoutes);
router.use('/categories', categoryRoutes);
router.use('/budgets', budgetRoutes); 

export default router;