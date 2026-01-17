import express, { Request, Response } from 'express';
import { env, logger } from '../config';
import { getStats } from '../services/broadcast.service';

export const startApiServer = () => {
  const app = express();

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.get('/stats', async (req: Request, res: Response): Promise<void> => {
    if (!env.ADMIN_API_KEY) {
      res.status(403).json({ error: 'API key not configured' });
      return;
    }
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== env.ADMIN_API_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const stats = await getStats();
    res.json(stats);
  });

  app.listen(env.PORT, () => {
    logger.info(`HTTP API listening on ${env.PORT}`);
  });
};
