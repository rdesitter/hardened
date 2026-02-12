import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { internalAuth } from './middleware/auth.js';

const app = new Hono();

app.use('*', logger());

// Health check — no auth required
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'shipsafe-api' });
});

// All /api/* routes require internal auth
app.use('/api/*', internalAuth);

// Placeholder routes — will be replaced by real scan logic later
app.post('/api/scans', (c) => {
  return c.json(
    { id: crypto.randomUUID(), status: 'pending', message: 'Scan engine not implemented yet' },
    201,
  );
});

app.get('/api/scans/:id', (c) => {
  return c.json({ id: c.req.param('id'), status: 'pending' });
});

app.get('/api/scans', (c) => {
  return c.json({ scans: [], total: 0 });
});

const port = Number(process.env.PORT) || 4000;

console.log(`ShipSafe API running on port ${port}`);

serve({ fetch: app.fetch, port });
