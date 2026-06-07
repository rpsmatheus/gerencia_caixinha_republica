import { Router } from 'express';
import { residentRoutes } from '../modules/residents/residents.routes.js';

const router = Router();

// Vincula as suas rotas de moradores ao prefixo /residents
router.use('/residents', residentRoutes);

export default router;