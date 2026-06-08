import { Request, Response, NextFunction } from 'express';

type Role = 'admin' | 'resident';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { role: Role } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    next();
  };
}