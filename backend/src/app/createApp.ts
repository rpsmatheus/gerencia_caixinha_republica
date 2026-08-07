import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { existsSync } from 'node:fs';
import router from './routes.js';

export function createApp(): express.Express {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  
  app.use(helmet());
  app.use(cors(corsOrigin?.length ? { origin: corsOrigin, credentials: true } : undefined));
  app.use(express.json());
  
  app.use('/api', router);

  const frontendDistPath = process.env.FRONTEND_DIST_PATH
    ? path.resolve(process.env.FRONTEND_DIST_PATH)
    : path.resolve(process.cwd(), '../frontend/dist');

  if (process.env.NODE_ENV === 'production' && existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }

      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }
  
  return app;
}
