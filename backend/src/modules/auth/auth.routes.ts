import { Router } from 'express';
import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { authMiddleware } from '../../shared/middlewares/authMiddleware.js';
import { ResidentRepository } from '../../repositories/ResidentRepository.js';
import { DatabaseConnection } from '../../config/database.js';
import { signAccessToken } from '../../shared/jwt.js';
import { IResident } from '../../models/Resident.js';

export const authRoutes: Router = Router();
const residentRepo = new ResidentRepository();

function toAuthResident(user: IResident) {
  return {
    id: String(user._id),
    nickname: user.nickname,
    fullName: user.fullName,
    phone: user.whatsappNumber ?? null,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
}

authRoutes.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
      return res.status(400).json({ error: 'usuário e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const existing = await residentRepo.findByNicknameWithPassword(nickname);
    if (existing) {
      return res.status(409).json({ error: 'Usuário já está em uso' });
    }

    const passwordHash = await argon2.hash(password);

    // Quem se registra é o administrador da república, não um morador —
    // não entra em Moradores nem na Caixinha Mensal (ver filtro role:'resident'
    // nas rotas de residents/monthly-balance/budgets).
    let resident: IResident;
    try {
      resident = await residentRepo.save({
        nickname: nickname.toLowerCase(),
        fullName: nickname,
        role: 'admin',
        republicId: randomUUID(),
        passwordHash,
        mustChangePassword: false,
        isActive: true,
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IResident);
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(409).json({ error: 'Usuário já está em uso' });
      }
      throw err;
    }

    const accessToken = await signAccessToken({
      sub: String(resident._id),
      role: resident.role,
      republicId: resident.republicId,
    });

    res.status(201).json({
      success: true,
      data: { accessToken, resident: toAuthResident(resident) },
    });
  })
);

authRoutes.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identificador e senha são obrigatórios' });
    }

    const user = await residentRepo.findByNicknameWithPassword(identifier);

    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const accessToken = await signAccessToken({
      sub: String(user._id),
      role: user.role,
      republicId: user.republicId,
    });

    res.json({
      success: true,
      data: { accessToken, resident: toAuthResident(user) },
    });
  })
);

authRoutes.post('/logout', (_req, res) => {
  res.json({ success: true });
});

authRoutes.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const db = DatabaseConnection.getInstance().getDatabase();
    const user = await db.collection<IResident>('residents').findOne({
      _id: new ObjectId(req.user!.id),
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não existe' });
    }

    res.json({ success: true, data: { resident: toAuthResident(user) } });
  })
);

authRoutes.post(
  '/change-password',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    const db = DatabaseConnection.getInstance().getDatabase();
    const current = await db.collection<IResident>('residents').findOne({
      _id: new ObjectId(req.user!.id),
      isActive: true,
    });

    if (!current || !(await argon2.verify(current.passwordHash, currentPassword))) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const passwordHash = await argon2.hash(newPassword);

    await db.collection<IResident>('residents').updateOne(
      { _id: current._id },
      { $set: { passwordHash, mustChangePassword: false, updatedAt: new Date() } }
    );

    res.json({ success: true });
  })
);
