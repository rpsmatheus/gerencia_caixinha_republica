import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes.js';

export function createApp(): express.Express {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  
  app.use('/api', router);
  
  return app;
}