import express from 'express';
import cors from 'cors';
import router from './routes.js';

export function createApp() {
  const app = express();

  // Configurações padrão solicitadas no plano
  app.use(cors());
  app.use(express.json());

  // Injeta todas as rotas da API sob o prefixo /api
  app.use('/api', router);

  // Middleware básico de tratamento de erros
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  });

  return app;
}