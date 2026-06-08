import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { DatabaseConnection } from '../../config/database.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userHeader = req.headers['x-user'];

  if (!userHeader || typeof userHeader !== 'string') {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  let parsed: { id?: string };

  try {
    parsed = JSON.parse(userHeader);
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (!parsed.id) {
    return res.status(401).json({ error: 'ID obrigatório' });
  }

  const db = DatabaseConnection.getInstance().getDatabase();

  // 🔥 aqui é o ponto crítico
  const user = await db.collection('residents').findOne({
    _id: new ObjectId(parsed.id),
    isActive: true,
  });

  if (!user) {
    return res.status(401).json({ error: 'Usuário não existe' });
  }

  req.user = {
    id: parsed.id,
    role: user.role,
    republicId: user.republicId,
  };

  next();
}