import { Express } from 'express';

export const setupRoutes = (app: Express) => {
  // Add your routes here
  app.get('/api', (_req, res) => {
    res.json({ message: 'API is running' });
  });
}; 