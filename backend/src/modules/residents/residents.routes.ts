import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { ResidentRepository } from '../../repositories/ResidentRepository.js';
import { ResidentFactory } from '../../factories/ResidentFactory.js';

export const residentRoutes: Router = Router();
const residentRepo = new ResidentRepository();

residentRoutes.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  // Chama o repositório passando os dois parâmetros corretos da interface
  const result = await residentRepo.findAll(page, limit);
  res.json({ success: true, ...result });
}));

residentRoutes.post('/', asyncHandler(async (req, res) => {
  const residentData = ResidentFactory.create(req.body);
  const savedResident = await residentRepo.save(residentData);
  res.status(201).json({ success: true, data: savedResident });
}));