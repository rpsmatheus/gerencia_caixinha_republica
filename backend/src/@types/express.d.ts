declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      role: 'admin' | 'resident';
      republicId: string;
    };
  }
}