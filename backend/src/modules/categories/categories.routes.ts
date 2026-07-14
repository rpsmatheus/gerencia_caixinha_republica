import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { categoryRepo } from '../../app/appContext.js';

export const categoryRoutes: Router = Router();

categoryRoutes.get(
  '/',
  authMiddleware,
  authorize('admin', 'resident'),
  asyncHandler(async (req, res) => {
    const categories = await categoryRepo.findAllByRepublic(req.user!.republicId);
    res.json({ success: true, data: categories });
  })
);

categoryRoutes.post(
  '/',
  authMiddleware,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name é obrigatório' });
    }

    const republicId = req.user!.republicId;
    const existing = await categoryRepo.findByNameAndRepublic(name, republicId);
    if (existing) {
      return res.status(409).json({ error: 'Já existe uma categoria com esse nome' });
    }

    const category = await categoryRepo.create(name.trim(), republicId);
    res.status(201).json({ success: true, data: category });
  })
);

categoryRoutes.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await categoryRepo.delete(req.params.id, req.user!.republicId);
    res.json({ success: true, message: 'Categoria removida com sucesso' });
  })
);
