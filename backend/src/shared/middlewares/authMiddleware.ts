// import { Request, Response, NextFunction } from 'express';

// export function authMiddleware(req: Request, res: Response, next: NextFunction) {
//   try {
//     const userHeader = req.headers['x-user'];

//     if (!userHeader || typeof userHeader !== 'string') {
//       return res.status(401).json({ error: 'Não autenticado' });
//     }

//     const user = JSON.parse(userHeader);

//     if (!user?.id || !user?.role) {
//       return res.status(401).json({ error: 'Token inválido' });
//     }

//     req.user = {
//       id: user._id.toString(),
//       role: user.role
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({ error: 'Token inválido' });
//   }
// }

// import { Request, Response, NextFunction } from "express";

// export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
//   try{
//     console.log("RAW HEADER:", req.headers["x-user"]);

//     const userHeader = req.headers["x-user"];

//     if (!userHeader || typeof userHeader !== "string") {
//       console.log("❌ header inválido ou não string");
//       return res.status(401).json({ error: "Não autenticado" });
//     }

//     let parsed;

//     try {
//       parsed = JSON.parse(userHeader);
//     } catch (e) {
//       console.log("❌ JSON parse falhou");
//       return res.status(401).json({ error: "Token inválido" });
//     }

//     console.log("PARSED:", parsed);

//     if (!parsed?.id || !parsed?.role || !parsed?.republicId) {
//       console.log("❌ faltando campos", parsed);
//       return res.status(401).json({ error: "Token inválido" });
//     }

//     req.user = {
//       id: user._id.toString(),
//       role: user.role,
//       republicId: user.republicId
//     };

//     next();
//   } catch {
//     return res.status(401).json({ error: "Token inválido" });
//   }
// }
import { Request, Response, NextFunction } from "express";

type Role = "admin" | "resident";

const MOCK_USERS: Record<string, { id: string; role: Role; republicId: string }> = {
  user1: { id: "user1", role: "resident", republicId: "rep1" },
  user2: { id: "user2", role: "resident", republicId: "rep2" },
  admin1: { id: "admin1", role: "admin", republicId: "rep1" },
};

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userHeader = req.headers["x-user"];

  if (!userHeader || typeof userHeader !== "string") {
    return res.status(401).json({ error: "Não autenticado" });
  }

  let parsed;

  try {
    parsed = JSON.parse(userHeader);
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }

  if (!parsed?.id) {
    return res.status(401).json({ error: "Token inválido" });
  }

  // 🔥 MOCK lookup (simula banco)
  const user = MOCK_USERS[parsed.id];

  if (!user) {
    return res.status(401).json({ error: "Usuário não existe" });
  }

  req.user = {
    id: user.id,
    role: user.role,
    republicId: user.republicId,
  };

  next();
}