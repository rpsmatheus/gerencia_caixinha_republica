import { Role } from '../../models/Resident';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        republicId: string;
      };
    }
  }
}

export {};