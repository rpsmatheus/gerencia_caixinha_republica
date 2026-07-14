import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { DatabaseConnection } from '../../config/database.js';
import { verifyAccessToken } from '../jwt.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const token = authHeader.slice('Bearer '.length);

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  const db = DatabaseConnection.getInstance().getDatabase();

  // Revalida contra o banco para refletir desativação/mudança de papel imediatamente
  const user = await db.collection('residents').findOne({
    _id: new ObjectId(payload.sub),
    isActive: true,
  });

  if (!user) {
    return res.status(401).json({ error: 'Usuário não existe' });
  }

  req.user = {
    id: payload.sub,
    role: user.role,
    republicId: user.republicId,
  };

  next();
}