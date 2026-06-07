import { Router } from 'express';
import { residentRoutes } from '../modules/residents/residents.routes.js';
import { categoryRoutes } from '../modules/categories/categories.routes.js'; // Adicione esse import

const router = Router();

router.use('/residents', residentRoutes);
router.use('/categories', categoryRoutes); // Adicione essa linha

export default router;