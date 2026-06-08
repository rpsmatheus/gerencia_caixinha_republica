import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { ResidentRepository } from '../../repositories/ResidentRepository.js';
import { ResidentFactory } from '../../factories/ResidentFactory.js';

import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export const residentRoutes: Router = Router();
const residentRepo = new ResidentRepository();

residentRoutes.get(
  '/',
  authMiddleware,
  authorize('admin', 'resident'),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const user = req.user!;

    const filter =
      user.role === 'admin'
        ? {}
        : { republicId: user.republicId };

    const result = await residentRepo.findAll(filter, page, limit);

    res.json({ success: true, ...result });
  })
);

residentRoutes.post(
  '/',
  authMiddleware,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = req.user!;

    const residentData = ResidentFactory.create({
      ...req.body,
      republicId: req.body.republicId ?? user.republicId,
    });

    const savedResident = await residentRepo.save(residentData);

    res.status(201).json({ success: true, data: savedResident });
  })
);