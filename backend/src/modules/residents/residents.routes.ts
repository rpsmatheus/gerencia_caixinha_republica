import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { ResidentRepository } from '../../repositories/ResidentRepository.js';
import { ResidentFactory } from '../../factories/ResidentFactory.js';
import { IResident } from '../../models/Resident.js';

import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export const residentRoutes: Router = Router();
const residentRepo = new ResidentRepository();

function toResidentDTO(resident: IResident) {
  return {
    id: String(resident._id),
    fullName: resident.fullName,
    nickname: resident.nickname,
    phone: resident.whatsappNumber ?? null,
    category: resident.category ?? 'Morador',
    isActive: resident.isActive,
    role: resident.role,
    createdAt: resident.createdAt,
  };
}

function generateTempPassword(): string {
  return randomBytes(6).toString('hex');
}

residentRoutes.get(
  '/',
  authMiddleware,
  authorize('admin', 'resident'),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const user = req.user!;

    // Cada admin é dono de UMA república (criada no registro), não de todas —
    // sem esse filtro, contas de repúblicas diferentes vazam dados entre si.
    const result = await residentRepo.findAll({ republicId: user.republicId }, page, limit);

    res.json({ success: true, data: result.data.map(toResidentDTO), total: result.total });
  })
);

residentRoutes.post(
  '/',
  authMiddleware,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const generatedPassword = req.body.password || generateTempPassword();

    const residentData = await ResidentFactory.create({
      ...req.body,
      password: generatedPassword,
      republicId: req.body.republicId ?? user.republicId,
    });

    const savedResident = await residentRepo.save(residentData);

    res.status(201).json({
      success: true,
      data: toResidentDTO(savedResident),
      // Só é útil quando o admin não informou uma senha própria
      ...(req.body.password ? {} : { generatedPassword }),
    });
  })
);

residentRoutes.put(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { id } = req.params;

    if (user.role !== 'admin' && user.id !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Nota: desativação/reativação passam por DELETE (soft delete), não por aqui —
    // residentRepo.update() reconsulta com filtro isActive:true, então setar
    // isActive:false neste patch faria a busca pós-update falhar.
    const { fullName, nickname, phone, category } = req.body;

    const patch: Partial<IResident> = {};
    if (fullName !== undefined) patch.fullName = fullName;
    if (nickname !== undefined) patch.nickname = String(nickname).toLowerCase();
    if (phone !== undefined) patch.whatsappNumber = phone;

    // Apenas admin pode alterar categoria
    if (user.role === 'admin' && category !== undefined) {
      patch.category = category;
    }

    let updated;
    try {
      updated = await residentRepo.update(id, patch);
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(409).json({ error: 'Apelido já está em uso' });
      }
      throw err;
    }

    res.json({ success: true, data: toResidentDTO(updated) });
  })
);

residentRoutes.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { id } = req.params;

    if (user.id === id) {
      return res.status(400).json({ error: 'Não é possível remover o seu próprio perfil.' });
    }

    await residentRepo.delete(id);

    res.json({ success: true });
  })
);
